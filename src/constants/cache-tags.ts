export const CACHE_TAGS = {
  // Global tags
  JOBS: "jobs",
  APPLICATIONS: "applications",
  USERS: "users",
  
  // Scoped tags
  COMPANY: "company",
  COMPANY_ALL: "company-all", // company + its jobs
  JOB_APPLICATIONS: "job-applications", // applications for a specific job
  USER_APPLICATIONS: "user-applications", // applications by a specific user
  USER: "user", // individual user data
} as const;