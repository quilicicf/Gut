export interface BranchFragment {
  isPoc?: boolean;
  issueId?: string;
  description: string;
}

export interface Branch {
  fragments: BranchFragment[]
}
