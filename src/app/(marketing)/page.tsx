'use client';

import { motion } from 'framer-motion';
import {
  GitBranch,
  MousePointer2,
  LayoutGrid,
  GraduationCap,
  Users,
  Heart,
  ArrowRight,
  Workflow,
  Zap,
  Table2,
  LucideIcon,
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

// Step number component with pulse glow
function StepNumber({ step, title, description, index }: { step: string; title: string; description: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="text-center group"
    >
      <motion.div
        whileHover={{ scale: 1.15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="relative w-14 h-14 mx-auto mb-4 cursor-pointer"
      >
        {/* Pulse glow rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-40"
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.4, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-30"
          animate={{
            scale: [1, 1.8, 1.8],
            opacity: [0.3, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.3,
          }}
        />

        {/* Glow behind on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-300" />

        {/* Main circle */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-shadow duration-300">
          {step}
        </div>
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// Use case card with border glow
function UseCaseCard({ icon: Icon, title, description, index }: { icon: LucideIcon; title: string; description: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      {/* Glow border effect */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-60"
      />

      {/* Card content */}
      <div className="relative p-6 rounded-2xl border border-border bg-card cursor-pointer transition-shadow duration-200 hover:shadow-lg">
        {/* Icon container with glow */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="relative inline-block mb-4"
        >
          {/* Icon glow */}
          <div className="absolute inset-0 rounded-lg bg-indigo-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
          <Icon className="relative w-10 h-10 text-indigo-500" />
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
      <Section className="pt-12 md:pt-20">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight"
          >
            Build Assessments That{' '}
            <span className="text-gradient">Actually Branch</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Visual flow builder for surveys, quizzes, and interactive forms.
            Create dynamic paths based on responses.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <CTAButton href="/login" variant="primary" size="lg">
              Get Started Free
            </CTAButton>
            <CTAButton href="/features" variant="outline" size="lg">
              See How It Works
              <ArrowRight className="w-4 h-4" />
            </CTAButton>
          </motion.div>
        </motion.div>

        {/* Hero Image/Canvas Preview */}
        <CanvasPreview />
      </Section>

      {/* Problem/Solution Section */}
      <Section className="bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Linear forms are limiting.{' '}
            <span className="text-foreground font-medium">
              FlowForm lets you create dynamic paths based on responses.
            </span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={GitBranch}
            title="Branch Logic"
            description="Route respondents to different questions based on their answers. No more irrelevant questions."
            index={0}
          />
          <FeatureCard
            icon={MousePointer2}
            title="Visual Builder"
            description="Drag and drop nodes on a canvas. See your entire flow at a glance."
            index={1}
          />
          <FeatureCard
            icon={LayoutGrid}
            title="One Question/Screen"
            description="Typeform-style experience that keeps respondents focused and engaged."
            index={2}
          />
        </div>
      </Section>

      {/* Features Grid */}
      <Section>
        <SectionHeader
          title="Everything you need"
          subtitle="Powerful features to create engaging assessments"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Workflow}
            title="Visual Canvas"
            description="Drag-and-drop node editor with smooth animations and intuitive controls."
            index={0}
          />
          <FeatureCard
            icon={Zap}
            title="Smart Branching"
            description="Condition-based paths that adapt to each respondent's answers."
            index={1}
          />
          <FeatureCard
            icon={Table2}
            title="Google Sheets"
            description="Responses automatically sync to your spreadsheet in real-time."
            index={2}
          />
        </div>
      </Section>

      {/* How It Works */}
      <Section className="bg-muted/30">
        <SectionHeader
          title="How it works"
          subtitle="Get started in three simple steps"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepNumber
            step="1"
            title="Design your flow"
            description="Drag questions onto the canvas and connect them visually."
            index={0}
          />
          <StepNumber
            step="2"
            title="Share the link"
            description="Publish your assessment and share it anywhere."
            index={1}
          />
          <StepNumber
            step="3"
            title="Collect responses"
            description="Watch responses come in and analyze the results."
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
            description="Create adaptive knowledge checks that adjust difficulty based on student responses."
            index={0}
          />
          <UseCaseCard
            icon={Users}
            title="HR Teams"
            description="Build screening assessments that route candidates based on qualifications."
            index={1}
          />
          <UseCaseCard
            icon={Heart}
            title="Coaches"
            description="Design client intake forms that gather relevant information based on goals."
            index={2}
          />
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-indigo-500/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to build smarter assessments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get started for free. No credit card required.
          </p>
          <CTAButton href="/login" variant="secondary" size="lg">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </CTAButton>
        </motion.div>
      </Section>
    </>
  );
}
