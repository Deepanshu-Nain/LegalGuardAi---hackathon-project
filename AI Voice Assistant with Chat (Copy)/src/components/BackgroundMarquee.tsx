import React from 'react';
import { motion } from 'motion/react';

const words = [
  'Adjustments', 'Agreements', 'Amendments', 'Anti-Corruption Laws', 'Applicable Laws', 'Approvals', 
  'Arbitration', 'Assignments', 'Assigns', 'Authority', 'Authorizations', 'Base Salary', 'Benefits', 
  'Binding Effects', 'Books', 'Brokers', 'Capitalization', 'Change In Control', 'Closings', 
  'Compliance With Laws', 'Confidentiality', 'Consent To Jurisdiction', 'Consents', 'Construction', 
  'Cooperation', 'Costs', 'Counterparts', 'Death', 'Defined Terms', 'Definitions', 'Disability', 
  'Disclosures', 'Duties', 'Effective Dates', 'Effectiveness', 'Employment', 'Enforceability', 
  'Enforcements', 'Entire Agreements', 'Erisa', 'Existence', 'Expenses', 'Fees', 'Financial Statements', 
  'Forfeitures', 'Further Assurances', 'General', 'Governing Laws', 'Headings', 'Indemnifications', 
  'Indemnity', 'Insurances', 'Integration', 'Intellectual Property', 'Interests', 'Interpretations', 
  'Jurisdictions', 'Liens', 'Litigations', 'Miscellaneous', 'Modifications', 'No Conflicts', 
  'No Defaults', 'No Waivers', 'Non-Disparagement', 'Notices', 'Organizations', 'Participations', 
  'Payments', 'Positions', 'Powers', 'Publicity', 'Qualifications', 'Records', 'Releases', 'Remedies', 
  'Representations', 'Sales', 'Sanctions', 'Severability', 'Solvency', 'Specific Performance', 
  'Submission To Jurisdiction', 'Subsidiaries', 'Successors', 'Survival', 'Tax Withholdings', 'Taxes', 
  'Terminations', 'Terms', 'Titles', 'Transactions With Affiliates', 'Use Of Proceeds', 'Vacations', 
  'Venues', 'Vesting', 'Waiver Of Jury Trials', 'Waivers', 'Warranties', 'Withholdings'
];

const shuffle = (array: string[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

const MarqueeRow = ({ direction, speed = 20 }: { direction: 'left' | 'right', speed?: number }) => {
  // Create a long string of random words
  const rowContent = React.useMemo(() => {
    return Array.from({ length: 5 }).map(() => shuffle(words).slice(0, 10).join(' • ')).join(' • ');
  }, []);

  return (
    <div className="flex overflow-hidden relative w-full whitespace-nowrap opacity-20">
      <motion.div
        className="flex whitespace-nowrap text-4xl font-bold text-[#555] font-['Poppins',sans-serif] py-4"
        animate={{
          x: direction === 'left' ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
      >
        <span className="mr-8">{rowContent}</span>
        <span className="mr-8">{rowContent}</span>
      </motion.div>
    </div>
  );
};

export const BackgroundMarquee = () => {
  return (
    <div className="absolute inset-0 bg-[#1a1a1a] flex flex-col justify-between overflow-hidden py-10 pointer-events-none select-none z-0">
      <MarqueeRow direction="left" speed={40} />
      <MarqueeRow direction="right" speed={45} />
      <MarqueeRow direction="left" speed={35} />
      <MarqueeRow direction="right" speed={50} />
      <MarqueeRow direction="left" speed={42} />
      <MarqueeRow direction="right" speed={38} />
      <MarqueeRow direction="left" speed={48} />
      <MarqueeRow direction="right" speed={40} />
      <MarqueeRow direction="left" speed={35} />
      <MarqueeRow direction="right" speed={45} />
    </div>
  );
};