export interface Project {
  id: string
  name: string
  slug: string
  isOwner: boolean
  updatedAt?: string
}

export const INITIAL_MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "E-Commerce Microservices",
    slug: "e-commerce-microservices",
    isOwner: true,
    updatedAt: "2 hours ago",
  },
  {
    id: "proj-2",
    name: "Real-time Analytics Engine",
    slug: "real-time-analytics-engine",
    isOwner: true,
    updatedAt: "Yesterday",
  },
  {
    id: "proj-3",
    name: "Auth & Identity Gateway",
    slug: "auth-identity-gateway",
    isOwner: true,
    updatedAt: "3 days ago",
  },
  {
    id: "proj-4",
    name: "Global CDN Edge Mesh",
    slug: "global-cdn-edge-mesh",
    isOwner: false,
    updatedAt: "5 days ago",
  },
  {
    id: "proj-5",
    name: "Payment Processing Core",
    slug: "payment-processing-core",
    isOwner: false,
    updatedAt: "Last week",
  },
]
