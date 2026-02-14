'use client';

import { motion } from 'framer-motion';
import {
  GitBranch,
  GraduationCap,
  Users,
  Heart,
  ArrowRight,
  Workflow,
  Zap,
  Palette,
  BarChart3,
  Lock,
  Award,
  LucideIcon,
  Sparkles,
  Check,
  X,
  Send,
  PenTool,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Section, SectionHeader, FeatureCard, CTAButton, CanvasPreview } from '@/presentation/components/marketing';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Comparison row for linear vs Assessio
function ComparisonRow({ linear, flowform, delay }: { linear: string; flowform: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 py-3 border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <X className="w-4 h-4 text-red-400 flex-shrink-0" />
        <span className="text-sm">{linear}</span>
      </div>
      <div className="w-px h-6 bg-border" />
      <div className="flex items-center gap-2 text-foreground">
        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-medium">{flowform}</span>
      </div>
    </motion.div>
  );
}

// Step component with connecting line
function StepCard({
  step,
  title,
  description,
  icon: Icon,
  index,
  isLast,
}: {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.2 }}
        className="relative group"
      >
        {/* Step number + icon */}
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300" />
            {/* Main */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <Icon className="w-6 h-6" />
            </div>
          </motion.div>
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-500">
            Step {step}
          </div>
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </motion.div>

      {/* Connecting arrow (not on last) */}
      {!isLast && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.2 + 0.3 }}
          className="hidden md:flex absolute -right-6 top-5 z-10 w-10 h-10 items-center justify-center rounded-full bg-background border border-border text-muted-foreground/50"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      )}
    </div>
  );
}

// Testimonial card
function TestimonialCard({
  quote,
  name,
  role,
  index,
}: {
  quote: string;
  name: string;
  role: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      <motion.div
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-indigo-500/50 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-60"
      />
      <div className="relative p-6 rounded-2xl border border-border bg-card h-full">
        {/* Quote mark */}
        <div className="text-4xl text-indigo-500/20 font-serif leading-none mb-3">&ldquo;</div>
        <p className="text-foreground/80 mb-4 leading-relaxed">{quote}</p>
        <div className="flex items-center gap-3 mt-auto">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
            {name[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Use case card with border glow
function UseCaseCard({ icon: Icon, title, description, accent, index }: { icon: LucideIcon; title: string; description: string; accent: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      <motion.div
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-60"
      />

      <div className="relative p-6 rounded-2xl border border-border bg-card cursor-pointer transition-shadow duration-200 hover:shadow-lg h-full">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="relative inline-block mb-4"
        >
          <div className={`absolute inset-0 rounded-xl ${accent} opacity-0 group-hover:opacity-100 blur-md transition-opacity`} />
          <div className={`relative w-12 h-12 rounded-xl ${accent} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <Section className="pt-4 md:pt-8 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -z-10" />

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-sm text-indigo-600 dark:text-indigo-400 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Free to use &mdash; No credit card required</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight"
          >
            Build Assessments That{' '}
            <span className="text-gradient">Actually Branch</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Design dynamic surveys, quizzes, and forms on a visual canvas.
            Drag, connect, branch &mdash; then share with a single link.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <CTAButton href="/login" variant="primary" size="lg">
              Start Building
              <ArrowRight className="w-4 h-4" />
            </CTAButton>
            <CTAButton href="/features" variant="outline" size="lg">
              See How It Works
            </CTAButton>
          </motion.div>
        </motion.div>

        <CanvasPreview />
      </Section>

      {/* Problem vs Solution */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: comparison table */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold uppercase tracking-wider mb-4">
              The problem
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Linear forms are <span className="line-through text-muted-foreground/60">boring</span> limiting
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Everyone gets the same questions in the same order. No personalization, no logic, no adaptivity.
            </p>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 pb-3 mb-1 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linear Forms</span>
                <div className="w-px h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Assessio</span>
              </div>
              <ComparisonRow linear="Same path for everyone" flowform="Dynamic branching logic" delay={0.1} />
              <ComparisonRow linear="No scoring or grading" flowform="Per-option scoring & NPS" delay={0.15} />
              <ComparisonRow linear="Basic form styling" flowform="6 themes + full customization" delay={0.2} />
              <ComparisonRow linear="Spreadsheet responses" flowform="Analytics dashboard + CSV" delay={0.25} />
              <ComparisonRow linear="Link sharing only" flowform="Link, embed, QR code" delay={0.3} />
            </div>
          </motion.div>

          {/* Right: visual illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-indigo-500/5 rounded-3xl blur-2xl" />

            <div className="relative rounded-2xl border border-border bg-card p-6 md:p-8">
              {/* Mini flow visualization */}
              <div className="space-y-4">
                {/* Start node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-2">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Welcome Screen</span>
                  </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center"
                  style={{ originY: 0 }}
                >
                  <div className="w-px h-6 bg-gradient-to-b from-emerald-500/40 to-indigo-500/40" />
                </motion.div>

                {/* Question node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 rounded-lg bg-indigo-500/5 border border-indigo-500/20 px-4 py-2">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">&ldquo;What&apos;s your role?&rdquo;</span>
                  </div>
                </motion.div>

                {/* Branch arrows */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 gap-3 pl-12"
                >
                  <div className="space-y-2">
                    <div className="w-full h-px bg-gradient-to-r from-indigo-500/40 to-violet-500/40" />
                    <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground">Developer</span>
                      <div className="text-[10px] text-violet-500 mt-0.5">→ Technical questions</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-px bg-gradient-to-r from-indigo-500/40 to-emerald-500/40" />
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground">Designer</span>
                      <div className="text-[10px] text-emerald-500 mt-0.5">→ Design questions</div>
                    </div>
                  </div>
                </motion.div>

                {/* Animated dot traveling */}
                <motion.div
                  className="absolute left-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
                  animate={{
                    y: [0, 30, 60, 90, 120],
                    opacity: [0, 1, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Features Grid */}
      <Section className="bg-muted/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl -z-10 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl -z-10 -translate-y-1/2" />

        <SectionHeader
          title="Everything you need"
          subtitle="Powerful features to create engaging assessments"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Workflow}
            title="Visual Canvas"
            description="Drag-and-drop node editor with smooth animations, auto-layout, and undo/redo."
            index={0}
          />
          <FeatureCard
            icon={Zap}
            title="Smart Branching"
            description="Condition-based paths with answer piping that adapt to each respondent."
            index={1}
          />
          <FeatureCard
            icon={Award}
            title="Scoring & NPS"
            description="Per-option points, score display on completion, and built-in NPS tracking."
            index={2}
          />
          <FeatureCard
            icon={Palette}
            title="Themes & Templates"
            description="6 pre-built templates plus custom colors, fonts, button and card styles."
            index={3}
          />
          <FeatureCard
            icon={BarChart3}
            title="Analytics"
            description="Response trends, score distribution, device breakdown, and CSV export."
            index={4}
          />
          <FeatureCard
            icon={Lock}
            title="Access Control"
            description="Password protection, invite-only mode, scheduling, and response limits."
            index={5}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-center mt-10"
        >
          <CTAButton href="/features" variant="outline">
            See all features
            <ArrowRight className="w-4 h-4" />
          </CTAButton>
        </motion.div>
      </Section>

      {/* How It Works */}
      <Section>
        <SectionHeader
          title="Three steps to launch"
          subtitle="From blank canvas to live assessment in minutes"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden md:block absolute top-7 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-border to-transparent"
            style={{ originX: 0 }}
          />

          <StepCard
            step="1"
            title="Design your flow"
            description="Drag questions onto the canvas and connect them visually. Choose from 11 question types and set up branching logic."
            icon={PenTool}
            index={0}
            isLast={false}
          />
          <StepCard
            step="2"
            title="Share the link"
            description="Publish your assessment and share via direct link, embeddable iframe, or downloadable QR code."
            icon={Send}
            index={1}
            isLast={false}
          />
          <StepCard
            step="3"
            title="Analyze responses"
            description="Track results in real-time with charts, score distribution, device breakdown, and CSV export."
            icon={Eye}
            index={2}
            isLast={true}
          />
        </div>
      </Section>

      {/* Social Proof / Testimonials */}
      <Section className="bg-muted/30">
        <SectionHeader
          title="Loved by creators"
          subtitle="See what people are building with Assessio"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TestimonialCard
            quote="The branching logic is exactly what I needed. My students get personalized quiz paths based on their skill level."
            name="Sarah K."
            role="University Instructor"
            index={0}
          />
          <TestimonialCard
            quote="We replaced 3 different tools with Assessio. The visual builder makes it so easy to design complex screening flows."
            name="Michael R."
            role="HR Manager"
            index={1}
          />
          <TestimonialCard
            quote="The theming system is incredible. Every client gets a fully branded assessment that matches their identity."
            name="Priya D."
            role="Business Coach"
            index={2}
          />
        </div>
      </Section>

      {/* Use Cases */}
      <Section>
        <SectionHeader
          title="Built for everyone"
          subtitle="From educators to entrepreneurs"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UseCaseCard
            icon={GraduationCap}
            title="Educators"
            description="Create adaptive quizzes with scoring, NPS feedback, and branching difficulty paths."
            accent="bg-indigo-500"
            index={0}
          />
          <UseCaseCard
            icon={Users}
            title="HR Teams"
            description="Build screening assessments with invite-only access and analytics dashboards."
            accent="bg-violet-500"
            index={1}
          />
          <UseCaseCard
            icon={Heart}
            title="Coaches"
            description="Design themed intake forms with password protection and custom branding."
            accent="bg-emerald-500"
            index={2}
          />
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-indigo-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white mb-6 shadow-lg shadow-indigo-500/30"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Ready to build smarter?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of creators building dynamic assessments.
            Free forever for individuals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton href="/login" variant="secondary" size="lg">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </CTAButton>
            <CTAButton href="/pricing" variant="outline" size="lg">
              View Pricing
            </CTAButton>
          </div>
        </motion.div>
      </Section>
    </>
  );
}
