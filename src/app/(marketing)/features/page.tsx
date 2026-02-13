'use client';

import { motion } from 'framer-motion';
import {
  Workflow,
  GitBranch,
  MessageSquare,
  CheckSquare,
  AlignLeft,
  Star,
  ToggleLeft,
  Table2,
  Smartphone,
  ArrowRight,
  Hash,
  Mail,
  ChevronDown,
  Calendar,
  Gauge,
  Type,
  Palette,
  BarChart3,
  Lock,
  QrCode,
  Code2,
  Link2,
  Award,
} from 'lucide-react';
import { Section, SectionHeader, CTAButton } from '@/presentation/components/marketing';
import {
  FlowBuilderIllust,
  BranchingIllust,
  ScoringIllust,
  ThemesIllust,
  AnalyticsIllust,
  ResponseTableIllust,
  SharingIllust,
  MobileIllust,
} from '@/presentation/components/marketing/illustrations';

const questionTypes = [
  { icon: MessageSquare, name: 'Multiple Choice', description: 'Single select from options' },
  { icon: CheckSquare, name: 'Checkbox', description: 'Multi-select with min/max' },
  { icon: Type, name: 'Short Text', description: 'Single-line text input' },
  { icon: AlignLeft, name: 'Long Text', description: 'Multi-line text input' },
  { icon: Star, name: 'Rating', description: 'Configurable scale' },
  { icon: ToggleLeft, name: 'Yes/No', description: 'Binary choice' },
  { icon: Hash, name: 'Number', description: 'Numeric input' },
  { icon: Mail, name: 'Email', description: 'Email with validation' },
  { icon: ChevronDown, name: 'Dropdown', description: 'Dropdown selection' },
  { icon: Calendar, name: 'Date', description: 'Date picker' },
  { icon: Gauge, name: 'NPS', description: '0-10 promoter score' },
];

const features = [
  {
    title: 'Visual Flow Builder',
    description: 'Design your assessments on an intuitive drag-and-drop canvas. See your entire flow at a glance, connect questions visually, and make changes instantly.',
    details: [
      'Drag and drop questions onto the canvas',
      'Visual connections between questions',
      'Zoom, pan, and organize your flow',
      'Undo/redo with full history',
      'Auto-layout for clean organization',
    ],
    icon: Workflow,
    Illustration: FlowBuilderIllust,
    reverse: false,
  },
  {
    title: 'Smart Branching',
    description: 'Create dynamic paths that adapt to each respondent. Route people to different questions based on their answers for a personalized experience.',
    details: [
      'Per-option branching for MCQ and Yes/No',
      'Conditional edges (equals, contains, greater/less than)',
      'Answer piping — reference previous answers in questions',
      'Complex decision trees made simple',
    ],
    icon: GitBranch,
    Illustration: BranchingIllust,
    reverse: true,
  },
  {
    title: 'Scoring & NPS',
    description: 'Assign points to options, track scores per question, and display results on the end screen. Built-in Net Promoter Score with promoter/detractor breakdown.',
    details: [
      'Per-option point values',
      'Show score on completion screen',
      'NPS gauge with distribution chart',
      'Score distribution analytics',
    ],
    icon: Award,
    Illustration: ScoringIllust,
    reverse: false,
  },
  {
    title: 'Themes & Customization',
    description: 'Make every assessment feel on-brand. Choose from 6 pre-built templates or customize colors, fonts, border radius, button style, and card style.',
    details: [
      '6 pre-built templates (Midnight, Ocean, Forest, Sunset, Minimal)',
      'Custom primary and background colors',
      'Font family selector (Inter, Merriweather, Geist)',
      'Button style and card style options',
    ],
    icon: Palette,
    Illustration: ThemesIllust,
    reverse: true,
  },
  {
    title: 'Analytics Dashboard',
    description: 'Understand your responses with a full analytics suite. Track completion rates, time to complete, score distribution, and response trends.',
    details: [
      'Response timeline and trend charts',
      'Score distribution histogram',
      'Device and source breakdown',
      'CSV export for all responses',
    ],
    icon: BarChart3,
    Illustration: AnalyticsIllust,
    reverse: false,
  },
  {
    title: 'Response Management',
    description: 'All responses are stored securely and available in real-time. Filter, sort, and export your data whenever you need it.',
    details: [
      'Real-time response collection',
      'Sortable and filterable response table',
      'Time-to-complete tracking per response',
      'CSV export for offline analysis',
    ],
    icon: Table2,
    Illustration: ResponseTableIllust,
    reverse: true,
  },
  {
    title: 'Sharing & Access Control',
    description: 'Share assessments via direct link, embed code, or QR code. Control who can respond with password protection, invite-only mode, and scheduling.',
    details: [
      'Password-protected assessments',
      'Invite-only with email or anonymous links',
      'Schedule open and close dates',
      'Response limits and QR code sharing',
    ],
    icon: Lock,
    Illustration: SharingIllust,
    reverse: false,
  },
  {
    title: 'Mobile-First Experience',
    description: 'Your assessments look great and work perfectly on any device. One question per screen keeps respondents focused.',
    details: [
      'Responsive design out of the box',
      'Touch-friendly interactions',
      'Embeddable via iframe or popup',
      'Typeform-style one question per screen',
    ],
    icon: Smartphone,
    Illustration: MobileIllust,
    reverse: true,
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <Section className="pt-12 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything you need to build{' '}
            <span className="text-gradient">dynamic assessments</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you create engaging, adaptive forms and surveys.
          </p>
        </motion.div>
      </Section>

      {/* Feature Deep Dives */}
      {features.map((feature, index) => (
        <Section key={index} className={index % 2 === 1 ? 'bg-muted/30' : ''}>
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
              feature.reverse ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <motion.div
              initial={{ opacity: 0, x: feature.reverse ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={feature.reverse ? 'lg:order-2' : ''}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-medium mb-4"
              >
                <feature.icon className="w-4 h-4" />
                Feature
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {feature.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.details.map((detail, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    </motion.div>
                    <span className="text-muted-foreground">{detail}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: feature.reverse ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={feature.reverse ? 'lg:order-1' : ''}
            >
              {/* Feature Illustration */}
              <feature.Illustration />
            </motion.div>
          </div>
        </Section>
      ))}

      {/* Question Types */}
      <Section>
        <SectionHeader
          title="11 Question Types"
          subtitle="All the building blocks you need for comprehensive assessments"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {questionTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-4 rounded-xl border border-border bg-card text-center cursor-pointer transition-shadow duration-200 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <type.icon className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              </motion.div>
              <h3 className="font-medium text-foreground mb-1">{type.name}</h3>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Sharing & Embed */}
      <Section className="bg-muted/30">
        <SectionHeader
          title="Share Anywhere"
          subtitle="Multiple ways to distribute your assessments"
        />

        <div className="flex flex-wrap justify-center gap-6">
          {[
            { icon: Link2, name: 'Direct Link', description: 'Shareable URL', available: true },
            { icon: Code2, name: 'Embed', description: 'Inline or popup iframe', available: true },
            { icon: QrCode, name: 'QR Code', description: 'Downloadable PNG', available: true },
            { icon: Table2, name: 'CSV Export', description: 'Download responses', available: true },
          ].map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-card cursor-pointer"
            >
              <motion.div whileHover={{ rotate: 10 }}>
                <item.icon className="w-8 h-8 text-indigo-500" />
              </motion.div>
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Try the demo or start building your first assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <CTAButton href="/dashboard" variant="secondary" size="lg">
                Start Building
                <ArrowRight className="w-4 h-4" />
              </CTAButton>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <CTAButton href="/pricing" variant="outline" size="lg">
                View Pricing
              </CTAButton>
            </motion.div>
          </div>
        </motion.div>
      </Section>
    </>
  );
}
