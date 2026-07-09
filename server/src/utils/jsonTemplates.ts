import { ResumeJSON } from '../types/resume';

export const defaultResume: ResumeJSON = {
  personalInfo: {
    fullName: "Alex Rivera",
    email: "alex.rivera@email.com",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA",
    website: "https://alexrivera.dev",
    linkedin: "linkedin.com/in/alexrivera",
    github: "github.com/alexrivera"
  },
  summary: "Senior Full Stack Engineer with 6+ years of experience designing and implementing scalable web applications, microservices, and user-centric interfaces. Expert in React, Node.js, and Cloud architectures, with a proven track record of optimizing application performance and leading agile engineering teams.",
  experience: [
    {
      id: "exp-1",
      company: "TechNexus Solutions",
      position: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      highlights: [
        "Led a team of 4 engineers to rebuild the enterprise dashboard in React, reducing load times by 40% and improving usability scores by 25%.",
        "Designed and implemented high-throughput REST APIs in Node.js and Express, supporting over 10,000 concurrent user sessions.",
        "Migrated legacy database systems to AWS PostgreSQL, resulting in a 30% reduction in database hosting costs and improved query speeds.",
        "Introduced CI/CD pipelines using GitHub Actions, decreasing release cycle times from bi-weekly to daily deployments."
      ]
    },
    {
      id: "exp-2",
      company: "Innovate Labs",
      position: "Software Engineer II",
      location: "Austin, TX",
      startDate: "2020-01",
      endDate: "2022-02",
      highlights: [
        "Developed and maintained critical components of a multi-tenant SaaS application using React, Redux, and TypeScript.",
        "Optimized client-side rendering and state management, resolving performance bottlenecks for users loading large datasets.",
        "Collaborated closely with UX designers to implement a custom, accessible component library based on WAI-ARIA guidelines.",
        "Wrote comprehensive unit and integration tests using Jest and React Testing Library, achieving 85% test coverage."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "CloudScale Analytics",
      description: "A real-time data visualization platform for cloud infrastructure metrics.",
      technologies: ["React", "TypeScript", "D3.js", "Node.js", "Express", "InfluxDB"],
      highlights: [
        "Engineered real-time data streaming features using WebSockets to display system metrics with sub-second latency.",
        "Created customizable dashboard layouts utilizing CSS Grid and HTML5 Drag and Drop APIs.",
        "Implemented secure JWT authentication and role-based access control (RBAC) for team domains."
      ],
      url: "https://github.com/alexrivera/cloudscale-analytics"
    },
    {
      id: "proj-2",
      name: "ScribeDoc API Gateway",
      description: "A fast, developer-friendly api gateway with rate limiting and logging.",
      technologies: ["Node.js", "Redis", "Docker", "Express", "Nginx"],
      highlights: [
        "Built a Redis-backed token bucket rate limiter capable of managing 500+ requests per second per node.",
        "Integrated structured JSON logging using Winston and mapped outputs to Elasticsearch.",
        "Packaged services with Docker and configured horizontal auto-scaling on AWS ECS."
      ]
    }
  ],
  skills: {
    languages: ["JavaScript", "TypeScript", "Python", "SQL", "HTML5", "CSS3"],
    frameworks: ["React", "Next.js", "Node.js", "Express", "Redux Toolkit", "Tailwind CSS"],
    tools: ["Git", "Docker", "AWS", "Webpack", "Vite", "GitHub Actions", "VS Code"],
    databases: ["PostgreSQL", "MongoDB", "Redis", "Elasticsearch"],
    cloud: ["AWS (S3, EC2, RDS, Lambda)", "Netlify", "Vercel"],
    softSkills: ["Team Leadership", "Technical Architecture", "Mentoring", "Agile Methodologies", "Cross-functional Collaboration"]
  },
  education: [
    {
      id: "edu-1",
      institution: "University of Texas at Austin",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      location: "Austin, TX",
      startDate: "2016-09",
      endDate: "2019-12",
      gpa: "3.7"
    }
  ],
  certifications: [
    "AWS Certified Solutions Architect – Associate",
    "Certified ScrumMaster (CSM)"
  ],
  achievements: [
    "Winner of Innovate Labs Annual Hackathon (2021) - Developed automated testing utility.",
    "Promoted from Software Engineer I to II within 12 months due to exceptional delivery."
  ]
};
