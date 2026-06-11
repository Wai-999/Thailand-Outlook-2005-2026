import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  TrendingUp,
  Factory,
  Map,
  Network,
  Plane,
  Wallet,
  LineChart,
  Calculator,
  Telescope,
  BookOpen,
  Database,
  FileText,
  PencilRuler,
  UserRound,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Phase-1 (Frontend MVP) build priority -- see CLAUDE_EFFICIENT.md */
  implemented: boolean;
  description: string;
};

// Order mirrors the spec's "Main Navigation" list. The earlier build
// phases shipped the core macro, sector, statistical, and data routes
// first, then expanded into tourism, debt, investment, and now the
// geography / trade / research surfaces. The newest pages stay honest:
// where the dataset lacks province-level or bilateral detail, they use
// explicit proxy analysis and name the limitation rather than inventing
// unsupported granular numbers.
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Command Center',
    href: '/',
    icon: LayoutDashboard,
    implemented: true,
    description: 'Where the story of the Thai economy starts each morning.',
  },
  {
    label: 'Macro Outlook',
    href: '/macro-outlook',
    icon: TrendingUp,
    implemented: true,
    description: 'GDP, inflation, trade, and the macro forces shaping growth.',
  },
  {
    label: 'Sector Intelligence',
    href: '/sector-intelligence',
    icon: Factory,
    implemented: true,
    description: 'How individual industries are really performing, sector by sector.',
  },
  {
    label: 'Regional & Urban Lens',
    href: '/province-map',
    icon: Map,
    implemented: true,
    description: 'Urbanization, digital inclusion, and the structural signals behind regional divergence.',
  },
  {
    label: 'External Sector',
    href: '/trade-network',
    icon: Network,
    implemented: true,
    description: 'Trade flows, external buffers, and the channels that carry global shocks inward.',
  },
  {
    label: 'Tourism Monitor',
    href: '/tourism-monitor',
    icon: Plane,
    implemented: true,
    description: 'Arrivals, spending, and the recovery of a vital growth engine.',
  },
  {
    label: 'Household & Debt',
    href: '/household-debt',
    icon: Wallet,
    implemented: true,
    description: 'How Thai households are saving, borrowing, and coping.',
  },
  {
    label: 'Investment Tracker',
    href: '/investment-tracker',
    icon: LineChart,
    implemented: true,
    description: 'Capital flows, FDI, and where confidence is (and isn’t) building.',
  },
  {
    label: 'Statistical Engine',
    href: '/statistical-engine',
    icon: Calculator,
    implemented: true,
    description: 'Correlation, regression, and risk scoring -- with the math shown.',
  },
  {
    label: 'Forecast Lab',
    href: '/forecast-lab',
    icon: Telescope,
    implemented: true,
    description: 'Transparent, scenario-based projections -- assumptions included.',
  },
  {
    label: 'Research Library',
    href: '/research-library',
    icon: BookOpen,
    implemented: true,
    description: 'Method notes, source structure, and deeper reading paths.',
  },
  {
    label: 'Data Sources',
    href: '/data-sources',
    icon: Database,
    implemented: true,
    description: 'Where every number comes from, and how fresh it is.',
  },
  {
    label: 'Data Editor',
    href: '/data-editor',
    icon: PencilRuler,
    implemented: true,
    description: 'Edit indicator values directly — no code changes needed.',
  },
  {
    label: 'Contact',
    href: '/contact',
    icon: UserRound,
    implemented: true,
    description: 'Who built this, and why.',
  },
];

export const DOCS_ITEM: NavItem = {
  label: 'Documentation',
  href: '/docs',
  icon: FileText,
  implemented: true,
  description: 'How this dashboard works, and how to read it responsibly.',
};
