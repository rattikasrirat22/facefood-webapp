/**
 * result.js — จัดการ UI สลับแท็บหมวดหมู่ และการสุ่มเมนูอาหารใหม่ (AJAX)
 * ================================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  const tabsEl = document.getElementById("tabs");
  const panelsEl = document.getElementById("panels");
  const remenuBtn = document.getElementById("remenuBtn");

  // 1. ระบบสลับแท็บหมวดหมู่ (อาหารจานหลัก / เครื่องดื่ม / วัตถุดิบ / ผลไม้)
  if (tabsEl) {
    tabsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;

      const cat = btn.dataset.cat;

      // ไฮไลต์ปุ่มแท็บที่เลือก
      tabsEl.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });

      // แสดงเฉพาะ Panel ของหมวดหมู่ที่เลือก
      if (panelsEl) {
        panelsEl.querySelectorAll(".food-panel").forEach((p) => {
          p.classList.toggle("active", p.dataset.cat === cat);
        });
      }
    });
  }

  // 2. ระบบสุ่มเมนูใหม่ (Remenu AJAX Request)
  if (remenuBtn) {
    remenuBtn.addEventListener("click", async () => {
      // ล็อกปุ่มป้องกันการกดซ้ำ และแสดงสถานะกำลังโหลด
      remenuBtn.disabled = true;
      const originalText = remenuBtn.textContent;
      remenuBtn.textContent = "กำลังสุ่ม...";

      if (panelsEl) {
        panelsEl.classList.add("loading-veil");
      }

      try {
        // เพิ่ม ?t=timestamp และ cache: 'no-store' เพื่อป้องกัน Browser/Client Caching
        const response = await fetch(`/remenu?t=${Date.now()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            emotion: window.__EMOTION__,
          }),
        });

        const data = await response.json();

        if (data.error) {
          alert("สุ่มเมนูใหม่ไม่สำเร็จ: " + data.error);
        } else if (data.food_items) {
          const categories = ["dish", "drink", "ingredient", "fruit"];

          // อัปเดตรายการอาหารในแต่ละหมวดหมู่บนหน้าเว็บ
          categories.forEach((catKey) => {
            const row = document.getElementById(`cards-${catKey}`);
            if (!row) return;

            row.innerHTML = ""; // ล้างข้อมูลรายการเดิม
            const items = data.food_items[catKey] || [];

            if (items.length === 0) {
              row.innerHTML = `<div class="empty-msg">ไม่มีรายการในหมวดนี้</div>`;
              return;
            }

            items.forEach((item) => {
              const card = document.createElement("div");
              card.className = "food-card";

              const icon =
                (window.__CATEGORY_ICONS__ && window.__CATEGORY_ICONS__[catKey]) ||
                "🍽️";
              const itemName = typeof item === "object" ? (item.menu_name || item.name || item.title) : item;

              card.innerHTML = `
                <div class="thumb">${icon}</div>
                <div class="caption"></div>
              `;
              card.querySelector(".caption").textContent = itemName;
              row.appendChild(card);
            });
          });
        }
      } catch (err) {
        console.error("Remenu Fetch Error:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
      } finally {
        // คืนค่าปุ่มและการแสดงผลกลับสู่สภาวะปกติ
        remenuBtn.disabled = false;
        remenuBtn.textContent = originalText;
        if (panelsEl) {
          panelsEl.classList.remove("loading-veil");
        }
      }
    });
  }
});