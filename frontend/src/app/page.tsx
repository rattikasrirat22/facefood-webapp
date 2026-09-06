import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import {
  IconCamera,
  IconMoodSearch,
  IconSalad,
  IconShieldCheck,
} from '@tabler/icons-react';

const steps = [
  {
    icon: IconCamera,
    title: 'Open your camera',
    description:
      'Press Start analysis and allow camera access, then face the camera directly in a well-lit spot.',
  },
  {
    icon: IconMoodSearch,
    title: 'Analyze your expression',
    description:
      'The model classifies your facial expression into one of four categories — happiness, sadness, anger, or neutral — in a few seconds.',
  },
  {
    icon: IconSalad,
    title: 'Get your suggestions',
    description:
      'Browse recommended food, ingredients, drinks, and fruits matched to that category.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
              <Image
                src="/hero-food.jpg"
                alt="An assortment of prepared dishes served on a table"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Text */}
          <div className="space-y-6">
            <p className="text-sm font-bold tracking-widest text-rosewood uppercase">
              Emotion-Based Food Recommendation
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Let your expression
              <br />
              guide your next meal
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              FaceFood analyzes your facial expression through your camera, then suggests
              food, ingredients, fruits, and drinks matched to the expression category it
              detects.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/#how-to-use"
                className="inline-flex items-center border border-clay/50 text-gray-800 px-8 py-3 rounded-full hover:border-rosewood hover:text-rosewood transition-colors font-medium"
              >
                How to use
              </Link>
              <Link
                href="/analyze"
                className="inline-flex items-center bg-clay text-mocha px-8 py-3 rounded-full hover:bg-clay-dark transition-colors font-semibold"
              >
                Start analysis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="scroll-mt-20 bg-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            How to use — three simple steps
          </h2>
          <p className="mt-3 text-gray-600">
            No sign-up required, and your camera images are not stored.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-snow rounded-2xl p-8 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blush text-mocha rounded-full flex items-center justify-center">
                    <step.icon size={26} stroke={1.8} />
                  </div>
                  <span className="text-5xl font-bold text-clay">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                About FaceFood
              </h2>
              <p className="text-gray-600 leading-relaxed">
                What we eat is often shaped by how we feel. FaceFood pairs facial
                expression analysis with suggestions for food, ingredients, drinks, and
                fruits across four expression categories — happiness, sadness, anger, and
                neutral. It is an academic project, not a medical or diagnostic tool.
              </p>
            </div>

            <div className="bg-blush rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-snow text-mocha rounded-full flex items-center justify-center">
                  <IconShieldCheck size={26} stroke={1.8} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your privacy</h3>
              </div>
              <ul className="mt-5 space-y-3 text-gray-600">
                <li>• Camera frames are processed for analysis only, and are not stored.</li>
                <li>• No sign-up and no personal details are required.</li>
                <li>• Runs in the browser on both desktop and mobile.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
