"""
model_utils.py (PyTorch version — ResNet18 + Attention)
================================================================================
"""

import json
import os
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import resnet18

# ---------------------------------------------------------
# Path Configuration: ชี้ไปที่ facefood-webapp/models/
# ---------------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

DEFAULT_MODEL_PATH = os.path.join(
    CURRENT_DIR, "models", "best_resnet18_attention_emotion.pth"
)
DEFAULT_CLASSES_PATH = os.path.join(CURRENT_DIR, "models", "classes.json")

MODEL_PATH = os.environ.get("MODEL_PATH", DEFAULT_MODEL_PATH)
CLASSES_PATH = os.environ.get("CLASSES_PATH", DEFAULT_CLASSES_PATH)

IMG_SIZE = 224
FACE_MARGIN = 0.05  # ขยายกรอบใบหน้าออกด้านละ 5% กันตัดคาง/หน้าผากตกขอบ

_face_cascade = None
_model = None
_class_names = None
_device = None
_preprocess = None


class POSTERModel(nn.Module):

  def __init__(self, num_classes=4):
    super(POSTERModel, self).__init__()
    self.backbone = resnet18(weights=None)
    in_features = self.backbone.fc.in_features
    self.backbone.fc = nn.Identity()

    self.attention = nn.MultiheadAttention(
        embed_dim=in_features, num_heads=8, batch_first=True
    )

    self.classifier = nn.Sequential(
        nn.Linear(in_features, 256),    # classifier.0
        nn.BatchNorm1d(256),           # classifier.1
        nn.ReLU(),                      # classifier.2
        nn.Dropout(0.5),                # classifier.3
        nn.Linear(256, num_classes),    # classifier.4
    )

  def forward(self, x):
    features = self.backbone(x)
    features_seq = features.unsqueeze(1)
    attn_out, _ = self.attention(features_seq, features_seq, features_seq)
    attn_out = attn_out.squeeze(1)
    out = self.classifier(attn_out)
    return out


def load_resources():
  """โหลดโมเดล PyTorch + Haar Cascade ครั้งเดียวตอน server เริ่มทำงาน"""
  global _face_cascade, _model, _class_names, _device, _preprocess

  if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"ไม่พบไฟล์โมเดลที่ {MODEL_PATH} — วางไฟล์ best_resnet18_attention_emotion.pth "
        f"ไว้ในโฟลเดอร์ models/ ก่อนรัน app.py"
    )
  if not os.path.exists(CLASSES_PATH):
    raise FileNotFoundError(
        f"ไม่พบไฟล์ {CLASSES_PATH} — วางไฟล์ classes.json ไว้ในโฟลเดอร์ models/"
        " ก่อนรัน app.py"
    )

  _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
  print(f"🖥️  ใช้งานอุปกรณ์: {_device}")

  with open(CLASSES_PATH, "r", encoding="utf-8") as f:
    _class_names = json.load(f)
  print(f"📊 ลำดับคลาส: {_class_names}")

  print(f"🧠 กำลังโหลดโมเดลจาก {MODEL_PATH} ...")
  _model = POSTERModel(num_classes=len(_class_names))
  
  checkpoint = torch.load(MODEL_PATH, map_location=_device, weights_only=False)
  if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
      _model.load_state_dict(checkpoint["state_dict"])
  elif isinstance(checkpoint, dict):
      _model.load_state_dict(checkpoint)
  else:
      _model = checkpoint

  _model.to(_device)
  _model.eval()
  print("✅ โหลดโมเดลสำเร็จ")

  _preprocess = transforms.Compose([
      transforms.ToPILImage(),
      transforms.Resize((IMG_SIZE, IMG_SIZE)),
      transforms.ToTensor(),
      transforms.Normalize(
          mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
      ),
  ])

  cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
  _face_cascade = cv2.CascadeClassifier(cascade_path)
  if _face_cascade.empty():
    raise RuntimeError("โหลด Haar Cascade ไม่สำเร็จ")
  print("✅ โหลด Haar Cascade face detector สำเร็จ")


def get_class_names():
  return _class_names


def _expand_box(x, y, w, h, frame_w, frame_h, margin=FACE_MARGIN):
  dx, dy = int(w * margin), int(h * margin)
  x1 = max(0, x - dx)
  y1 = max(0, y - dy)
  x2 = min(frame_w, x + w + dx)
  y2 = min(frame_h, y + h + dy)
  return x1, y1, x2, y2


# ห้ามเพิ่มการปรับแสง/คอนทราสต์ใดๆ (CLAHE, equalizeHist, gamma correction ฯลฯ) ก่อนป้อน
# ภาพเข้าโมเดลจำแนกอารมณ์ในฟังก์ชันนี้ เพราะเทรนด้วย Resize→ToTensor→Normalize เท่านั้น
# (ดู val_transforms ใน train_model.py) เคยเกิดปัญหานี้มาแล้ว 3 ครั้ง
def detect_and_predict(frame_bgr):
  """รับภาพ OpenCV Frame (BGR) -> ตรวจจับใบหน้า -> ทำนายอารมณ์"""
  if _model is None or _face_cascade is None:
    load_resources()

  gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)

  faces = _face_cascade.detectMultiScale(
      gray, scaleFactor=1.1, minNeighbors=6, minSize=(80, 80)
  )

  if len(faces) == 0:
    return {"face_found": False, "box": None, "probs": None, "top_emotion": "Neutral"}

  x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
  frame_h, frame_w = frame_bgr.shape[:2]
  x1, y1, x2, y2 = _expand_box(x, y, w, h, frame_w, frame_h)

  face_crop_bgr = frame_bgr[y1:y2, x1:x2]
  if face_crop_bgr.size == 0:
    return {"face_found": False, "box": None, "probs": None, "top_emotion": "Neutral"}

  face_rgb = cv2.cvtColor(face_crop_bgr, cv2.COLOR_BGR2RGB)

  input_tensor = _preprocess(face_rgb).unsqueeze(0).to(_device)

  with torch.no_grad():
    logits = _model(input_tensor)
    probs_tensor = torch.softmax(logits, dim=1)[0]

  probs = {
      cls: float(round(p * 100, 2))
      for cls, p in zip(_class_names, probs_tensor.cpu().numpy())
  }

  top_emotion = max(probs, key=probs.get) if probs else "Neutral"

  return {
      "face_found": True,
      "box": [int(x1), int(y1), int(x2), int(y2)],
      "probs": probs,
      "top_emotion": top_emotion
  }


def predict_emotion_from_bgr(frame_bgr):
    """ฟังก์ชันรองรับการเรียกใช้งานจาก app.py"""
    return detect_and_predict(frame_bgr)