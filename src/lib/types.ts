export interface UserAnswers {
  role: string;
  want: string;
  fear: string;
}

export interface Profile {
  sector: string;
  seniority: string;
  transferableSkills: string[];
  primaryGoal: string;
  coreAnxiety: string;
  profileSummary: string;
}

export interface Path {
  name: string;
  type: string;
  timeToFirstRevenue: string;
  effortLevel: "Low" | "Medium" | "High";
  revenueRange: string;
  riskLevel: "Low" | "Medium" | "High";
  whyThisWorks: string;
  biggestObstacle: string;
  fit: number;
}

export interface Milestone {
  milestone: string;
  actions: string[];
  metric: string;
}

export interface Plan {
  firstMove: string;
  warning: string;
  day30: Milestone;
  day60: Milestone;
  day90: Milestone;
}

export interface AnalysisResult {
  profile: Profile;
  paths: Path[];
  plan: Plan;
}
