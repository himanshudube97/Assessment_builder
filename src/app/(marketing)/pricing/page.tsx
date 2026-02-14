'use client';

import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { Section, SectionHeader, PricingCard } from '@/presentation/components/marketing';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out Assessio',
    features: [
      '3 assessments',
      '50 responses/month',
      'All 11 question types',
      'Visual flow builder',
      'Smart branching',
      'Assessio watermark',
    ],
    cta: 'Get Started',
    ctaHref: '/dashboard',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 12,
    period: 'month',
    description: 'For professionals and small teams',
    features: [
      'Unlimited assessments',
      '1,000 responses/month',
      'All 11 question types',
      'Remove watermark',
      'Themes & custom branding',
      'Scoring & NPS',
      'Analytics dashboard',
      'CSV export',
      'Password protection',
      'Scheduling & response limits',
      'QR code & embed',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/dashboard',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: 39,
    period: 'month',
    description: 'For teams and agencies',
    features: [
      'Unlimited assessments',
      '10,000 responses/month',
      'Everything in Pro',
      'Invite-only assessments',
      'Custom domain',
      'White-label branding',
      'Dedicated support',
      'API access',
    ],
    cta: 'Contact Sales',
    ctaHref: '/dashboard',
    highlighted: false,
  },
];

const featureComparison = [
  { feature: 'Assessments', free: '3', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Responses/month', free: '50', pro: '1,000', agency: '10,000' },
  { feature: 'Question types', free: 'All 11', pro: 'All 11', agency: 'All 11' },
  { feature: 'Visual flow builder', free: true, pro: true, agency: true },
  { feature: 'Smart branching', free: true, pro: true, agency: true },
  { feature: 'Answer piping', free: true, pro: true, agency: true },
  { feature: 'Scoring & NPS', free: false, pro: true, agency: true },
  { feature: 'Themes & templates', free: false, pro: true, agency: true },
  { feature: 'Analytics dashboard', free: false, pro: true, agency: true },
  { feature: 'CSV export', free: false, pro: true, agency: true },
  { feature: 'Remove watermark', free: false, pro: true, agency: true },
  { feature: 'Password protection', free: false, pro: true, agency: true },
  { feature: 'Scheduling', free: false, pro: true, agency: true },
  { feature: 'QR code & embed', free: false, pro: true, agency: true },
  { feature: 'Response limits', free: false, pro: true, agency: true },
  { feature: 'Invite-only mode', free: false, pro: false, agency: true },
  { feature: 'Custom domain', free: false, pro: false, agency: true },
  { feature: 'White-label branding', free: false, pro: false, agency: true },
  { feature: 'Dedicated support', free: false, pro: false, agency: true },
  { feature: 'API access', free: false, pro: false, agency: true },
  { feature: 'Priority support', free: false, pro: true, agency: true },
];

const faqs = [
  {
    question: 'Can I switch plans?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
  },
  {
    question: 'What happens when I exceed my limits?',
    answer: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or wait until the next billing cycle for limits to reset.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us for a full refund.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! You can start with our Free plan to try out Assessio. When you\'re ready for more features, you can upgrade to Pro with a 14-day free trial.',
  },
  {
    question: 'What question types are included?',
    answer: 'All plans include all 11 question types: Multiple Choice, Checkbox, Short Text, Long Text, Rating, Yes/No, Number, Email, Dropdown, Date, and NPS.',
  },
];

export default function PricingPage() {
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
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when ready. No hidden fees.
          </p>
        </motion.div>
      </Section>

      {/* Pricing Cards */}
      <Section className="pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} {...plan} index={index} />
          ))}
        </div>
      </Section>

      {/* Feature Comparison */}
      <Section className="bg-muted/30">
        <SectionHeader
          title="Compare plans"
          subtitle="See what's included in each plan"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-medium text-foreground">Feature</th>
                <th className="text-center py-4 px-4 font-medium text-foreground">Free</th>
                <th className="text-center py-4 px-4 font-medium text-indigo-500">Pro</th>
                <th className="text-center py-4 px-4 font-medium text-foreground">Agency</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border"
                >
                  <td className="py-4 px-4 text-muted-foreground">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    <FeatureValue value={row.free} />
                  </td>
                  <td className="py-4 px-4 text-center bg-indigo-500/5">
                    <FeatureValue value={row.pro} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <FeatureValue value={row.agency} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </Section>

      {/* FAQ */}
      <Section>
        <SectionHeader
          title="Frequently asked questions"
          subtitle="Everything you need to know about our pricing"
        />

        <div className="max-w-3xl mx-auto">
          <div className="grid gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -2 }}
                className="p-6 rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-indigo-500 mx-auto" />
    ) : (
      <Minus className="w-5 h-5 text-muted-foreground/50 mx-auto" />
    );
  }
  return <span className="text-foreground">{value}</span>;
}
