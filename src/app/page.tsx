import Link from "next/link";
import {
  Dumbbell,
  Brain,
  BookOpen,
  CreditCard,
  ArrowRight,
  Zap,
  Shield,
  Target,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-коучинг",
    description:
      "Персоналізовані тренувальні програми на основі штучного інтелекту та знань реальних тренерів.",
  },
  {
    icon: BookOpen,
    title: "База знань",
    description:
      "Тренери завантажують власні методики, AI використовує їх для індивідуальних рекомендацій.",
  },
  {
    icon: CreditCard,
    title: "Підписки",
    description:
      "Гнучка система підписок із доступом до різних тренерів та рівнів консультацій.",
  },
  {
    icon: Target,
    title: "Трекінг прогресу",
    description:
      "Відстежуйте силові показники, аналізуйте динаміку та досягайте нових рекордів.",
  },
  {
    icon: Shield,
    title: "Верифіковані тренери",
    description:
      "Кожен тренер проходить інтерв'ю та верифікацію перед допуском на платформу.",
  },
  {
    icon: Zap,
    title: "Миттєві відповіді",
    description:
      "AI-асистент відповідає 24/7, базуючись на методиках обраного тренера.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Power<span className="text-primary">Inside</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Увійти
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Реєстрація
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              AI-powered coaching
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            Платформа для
            <br />
            <span className="text-primary">силових видів спорту</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted mb-10 leading-relaxed">
            Персоналізований AI-коучинг на основі методик реальних тренерів.
            Пауерліфтинг, стронгмен, важка атлетика — знайдіть свого тренера та
            досягайте нових висот.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?role=athlete"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              Я — атлет
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/register?role=coach"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-secondary text-foreground font-semibold text-base hover:bg-secondary-hover border border-border transition-all duration-200"
            >
              Я — тренер
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Все для вашого <span className="text-primary">прогресу</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Ми об&apos;єднуємо досвід найкращих тренерів із можливостями
              штучного інтелекту.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-card-hover transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Готові стати сильнішими?
            </h2>
            <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
              Приєднуйтесь до PowerInside — платформи, де AI та досвід тренерів
              працюють на ваш результат.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?role=athlete"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all duration-200"
              >
                Почати тренуватись
              </Link>
              <Link
                href="/register?role=coach"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary-hover border border-border transition-all duration-200"
              >
                Стати тренером
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">
              Power<span className="text-primary">Inside</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PowerInside. Всі права захищені.
          </p>
        </div>
      </footer>
    </div>
  );
}
