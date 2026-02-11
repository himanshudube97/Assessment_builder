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
} from 'lucide-react';
import { Section, SectionHeader, CTAButton } from '@/presentation/components/marketing';

const questionTypes = [
  { icon: MessageSquare, name: 'Multiple Choice', description: 'Single select from options' },
  { icon: CheckSquare, name: 'Checkbox', description: 'Multi-select options' },
  { icon: AlignLeft, name: 'Text', description: 'Short or long text input' },
  { icon: Star, name: 'Rating', description: 'Star or number scale' },
  { icon: ToggleLeft, name: 'Yes/No', description: 'Binary choice' },
];

const features = [
  {
    title: 'Visual Flow Builder',
    description: 'Design your assessments on an intuitive drag-and-drop canvas. See your entire flow at a glance, connect questions visually, and make changes instantly.',
    details: [
      'Drag and drop questions onto the canvas',
      'Visual connections between questions',
      'Zoom, pan, and organize your flow',
      'Real-time preview of your assessment',
    ],
    icon: Workflow,
    reverse: false,
  },
  {
    title: 'Smart Branching',
    description: 'Create dynamic paths that adapt to each respondent. Route people to different questions based on their answers for a personalized experience.',
    details: [
      'Condition-based routing',
      'Multiple paths from single questions',
      'Skip logic and conditional display',
      'Complex decision trees made simple',
    ],
    icon: GitBranch,
    reverse: true,
  },
  {
    title: 'Google Sheets Integration',
    description: 'Automatically sync responses to Google Sheets in real-time. Analyze, filter, and share your data with ease.',
    details: [
      'One-click connection to Sheets',
      'Real-time response syncing',
      'Custom column mapping',
      'Preserve response history',
    ],
    icon: Table2,
    reverse: false,
  },
  {
    title: 'Mobile-First Experience',
    description: 'Your assessments look great and work perfectly on any device. One question per screen keeps respondents focused.',
    details: [
      'Responsive design out of the box',
      'Touch-friendly interactions',
      'Fast loading on any connection',
      'Typeform-style one question per screen',
    ],
    icon: Smartphone,
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
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative aspect-video rounded-2xl border border-border bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden cursor-pointer group"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <feature.icon className="w-24 h-24 text-indigo-500/20 group-hover:text-indigo-500/30 transition-colors" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                {/* Glow effect on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10"
                />
              </motion.div>
            </motion.div>
          </div>
        </Section>
      ))}

      {/* Question Types */}
      <Section>
        <SectionHeader
          title="6 Question Types"
          subtitle="All the building blocks you need for comprehensive assessments"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {questionTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
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

      {/* Integrations */}
      <Section className="bg-muted/30">
        <SectionHeader
          title="Integrations"
          subtitle="Connect FlowForm to your favorite tools"
        />

        <div className="flex flex-wrap justify-center gap-6">
          {[
            { icon: Table2, name: 'Google Sheets', status: 'Available now', available: true },
            { icon: null, name: 'REST API', status: 'Coming soon', available: false },
            { icon: null, name: 'Zapier', status: 'Coming soon', available: false },
          ].map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={integration.available ? { y: -4, scale: 1.02 } : {}}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-card ${
                !integration.available ? 'opacity-60' : 'cursor-pointer'
              }`}
            >
              {integration.icon ? (
                <motion.div whileHover={{ rotate: 10 }}>
                  <integration.icon className="w-8 h-8 text-emerald-500" />
                </motion.div>
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {integration.name === 'REST API' ? 'API' : 'Zap'}
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{integration.name}</p>
                <p className="text-sm text-muted-foreground">{integration.status}</p>
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
