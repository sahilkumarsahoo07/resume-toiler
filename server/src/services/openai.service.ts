import { getAIClient, isMockMode } from '../config/openai';
import { JDAnalysis } from '../types/jd';
import { ResumeJSON } from '../types/resume';
import { ResumeCompareResult, SuggestionItem } from '../types/suggestions';
import { defaultResume } from '../utils/jsonTemplates';

/**
 * Safely parses JSON from AI responses, removing markdown code blocks if present.
 */
function safelyParseJSON<T>(content: string): T {
  try {
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
      // Remove first line (e.g. ```json)
      cleanContent = cleanContent.replace(/^```[a-z]*\n/, '');
      // Remove last line (```)
      cleanContent = cleanContent.replace(/\n```$/, '');
    }
    return JSON.parse(cleanContent.trim()) as T;
  } catch (error) {
    console.error('JSON Parsing Failed:', content);
    throw error;
  }
}

/**
 * AI Service for Job Description extraction, Resume comparison, and merging suggestions.
 */
export class OpenAIService {
  
  /**
   * Step 1: Extract Job Description details
   */
  static async analyzeJD(jdText: string, reqModelId?: string): Promise<JDAnalysis> {
    const { client, model } = getAIClient(reqModelId);
    if (isMockMode || !client) {
      return this.mockAnalyzeJD(jdText);
    }

    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a professional recruiting coordinator. Parse the Job Description and extract structured information into a single JSON object.
Do NOT fabricate. Use direct details. 
Return only a JSON object matching this schema:
{
  "jobTitle": "string",
  "experienceRequired": "string",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "responsibilities": ["string"],
  "technologies": ["string"],
  "softSkills": ["string"],
  "atsKeywords": ["string"],
  "actionVerbs": ["string"],
  "industry": "string"
}`
          },
          {
            role: 'user',
            content: `Job Description:\n\n${jdText}`
          }
        ],
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content || '{}';
      return safelyParseJSON<JDAnalysis>(content);
    } catch (error: any) {
      console.error('Error analyzing JD with OpenAI:', error);
      if (error?.status === 429) {
        console.warn('Rate limit hit during JD analysis. Falling back to mock data.');
        return this.mockAnalyzeJD(jdText);
      }
      throw error;
    }
  }

  /**
   * Step 2: Compare Resume JSON with JD Analysis and generate suggestions
   */
  static async compareResumeWithJD(resume: ResumeJSON, jdAnalysis: JDAnalysis, reqModelId?: string): Promise<ResumeCompareResult> {
    const { client, model } = getAIClient(reqModelId);
    if (isMockMode || !client) {
      return this.mockCompare(resume, jdAnalysis);
    }

    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a Senior Career Coach and ATS Expert. Compare the user's Resume JSON against the parsed Job Description details.
Generate match metrics and optimization suggestions.

CRITICAL RULES:
1. NEVER fabricate fake work experiences, companies, job duration, or certifications.
2. Suggestions must be optimization actions on existing content, EXCEPT for missing skills required by the job description.
3. For missing skills, you MUST generate a suggestion with category 'skills' that proposes adding those missing skills. For this suggestion, the 'proposedText' field MUST contain a clean, comma-separated list of the specific missing skills to add (e.g. "Docker, Kubernetes, AWS"), and the 'explanation' field should describe what skills are being added and why.
4. Do NOT fabricate metrics (e.g., do not suggest changing "improved performance" to "improved performance by 45%" unless "45%" or a similar number was already specified in the source text).
5. Each suggestion targeting work experience or project bullets MUST contain 'originalText' (the exact text in the resume) and 'proposedText' (the optimized, tailored replacement line).
6. Generate an id (e.g. 'sugg-1') for each suggestion.

Return only a JSON object matching this schema:
{
  "matchedSkills": ["string"],
  "missingSkills": ["string"],
  "weakSections": ["string"],
  "keywordCoverage": number (0-100),
  "atsScore": number (0-100),
  "suggestions": [
    {
      "id": "string",
      "category": "summary" | "experience" | "skills" | "projects" | "general",
      "targetId": "string (the 'id' of the experience or project item, if applicable)",
      "title": "string",
      "explanation": "string",
      "originalText": "string (optional)",
      "proposedText": "string (optional)",
      "impactScore": number (1-10)
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Resume:\n${JSON.stringify(resume, null, 2)}\n\nJob Description Analysis:\n${JSON.stringify(jdAnalysis, null, 2)}`
          }
        ],
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content || '{}';
      return safelyParseJSON<ResumeCompareResult>(content);
    } catch (error: any) {
      console.error('Error comparing resume with OpenAI:', error);
      if (error?.status === 429) {
        console.warn('Rate limit hit during comparison. Falling back to mock data.');
        return this.mockCompare(resume, jdAnalysis);
      }
      throw error;
    }
  }

  /**
   * Step 4: Apply selected suggestions using AI for stylistic flow while maintaining rules
   */
  static async applySuggestions(resume: ResumeJSON, selectedSuggestions: SuggestionItem[], reqModelId?: string): Promise<ResumeJSON> {
    const { client, model } = getAIClient(reqModelId);
    if (isMockMode || !client) {
      return this.programmaticMerge(resume, selectedSuggestions);
    }

    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a resume data compiler. You will receive a Resume JSON and a list of specific SuggestionItems (which contain proposedText, targetId, category, and explanation fields).
Your task is to merge these suggestions directly into the Resume JSON.

CRITICAL RULES:
1. Only modify fields targeted by the selected suggestions.
2. If a suggestion has category 'skills', you MUST add the missing skills mentioned in the suggestion (from its 'proposedText' or 'explanation') into the appropriate arrays under the 'skills' object of the Resume JSON.
   - For example:
     - Cloud platforms (like 'AWS', 'Azure', 'GCP', 'Cloud') go to 'skills.cloud'.
     - Databases (like 'MongoDB', 'PostgreSQL', 'SQL', 'Redis') go to 'skills.databases'.
     - Languages (like 'TypeScript', 'Python', 'Go', 'Rust', 'JavaScript') go to 'skills.languages'.
     - Frameworks/Libraries (like 'React', 'Angular', 'Express', 'Django', 'Next.js') go to 'skills.frameworks'.
     - Devops/Tools (like 'Docker', 'Kubernetes', 'Git', 'Webpack') go to 'skills.tools'.
     - Soft skills go to 'skills.softSkills'.
     - If you are unsure which category a skill belongs to, default to adding it to 'skills.tools'.
   - Avoid duplicate skills in the lists. Ensure they are added as clean strings.
   - If a specific skills array (like 'databases' or 'cloud') does not exist under the 'skills' object, initialize it as an empty array before adding the skills.
3. Under no circumstances should you fabricate any experience, company, year, school, or credentials. Adding missing skills to the skills lists as requested by the suggestions is permitted and required.
4. Keep formatting clean and maintain the JSON structure perfectly.
5. Output the updated Resume JSON matching the input schema. No markdown formatting outside of JSON.`
          },
          {
            role: 'user',
            content: `Resume:\n${JSON.stringify(resume, null, 2)}\n\nSelected Suggestions to Merge:\n${JSON.stringify(selectedSuggestions, null, 2)}`
          }
        ],
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content || '{}';
      return safelyParseJSON<ResumeJSON>(content);
    } catch (error: any) {
      console.error('Error applying suggestions with OpenAI:', error);
      if (error?.status === 429) {
        console.warn('Rate limit hit during suggestion apply. Falling back to mock data.');
        return this.programmaticMerge(resume, selectedSuggestions);
      }
      throw error;
    }
  }

  /**
   * Parse unstructured resume text into a structured JSON model using AI
   */
  static async parseResumeText(resumeText: string, reqModelId?: string): Promise<ResumeJSON> {
    const { client, model } = getAIClient(reqModelId);
    if (isMockMode || !client) {
      return defaultResume;
    }

    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Parse the raw, unstructured resume text and convert it into a single clean JSON object matching the ResumeJSON schema.
Extract personal info, summary, experience, projects, skills, education, certifications, and achievements.
Do NOT fabricate any experience. If fields are missing (like achievements or certifications), return empty arrays.
Assign a unique 'id' to each experience entry (e.g. 'exp-1', 'exp-2') and project entry (e.g. 'proj-1', 'proj-2').

Return only a JSON object matching this schema:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string (optional)",
    "linkedin": "string (optional)",
    "github": "string (optional)"
  },
  "summary": "string",
  "experience": [
    {
      "id": "string",
      "company": "string",
      "position": "string",
      "location": "string",
      "startDate": "string (e.g. YYYY-MM)",
      "endDate": "string (e.g. YYYY-MM or Present)",
      "highlights": ["string (bullet points)"]
    }
  ],
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "highlights": ["string (optional)"],
      "url": "string (optional)"
    }
  ],
  "skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "tools": ["string"],
    "databases": ["string (optional)"],
    "cloud": ["string (optional)"],
    "softSkills": ["string"]
  },
  "education": [
    {
      "id": "string",
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string (optional)"
    }
  ],
  "certifications": ["string"],
  "achievements": ["string"]
}`
          },
          {
            role: 'user',
            content: `Raw Resume Text:\n\n${resumeText}`
          }
        ],
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content || '{}';
      return safelyParseJSON<ResumeJSON>(content);
    } catch (error: any) {
      console.error('Error parsing resume text with AI:', error);
      if (error?.status === 429) {
        console.warn('Rate limit hit during resume parsing. Falling back to mock data.');
        return defaultResume;
      }
      throw error;
    }
  }

  // ==========================================
  // High-Fidelity Mock Implementations
  // ==========================================

  private static mockAnalyzeJD(jdText: string): JDAnalysis {
    const textLower = jdText.toLowerCase();
    
    // Extract keywords based on common patterns in the text
    const titleMatch = jdText.match(/(?:job title|position|role):\s*([^\n\r]+)/i) || 
                      jdText.match(/^([^\n\r]{5,40}(?:engineer|developer|manager|architect|designer|analyst|consultant))/i);
    const jobTitle = titleMatch ? titleMatch[1].trim() : "Software Engineer";

    const allSkills = [
      { name: "React", keywords: ["react", "react.js", "reactjs", "frontend"] },
      { name: "TypeScript", keywords: ["typescript", "ts"] },
      { name: "Node.js", keywords: ["node", "node.js", "nodejs", "backend"] },
      { name: "Express", keywords: ["express", "expressjs"] },
      { name: "Python", keywords: ["python", "django", "flask"] },
      { name: "AWS", keywords: ["aws", "cloud", "amazon", "s3", "ec2"] },
      { name: "Docker", keywords: ["docker", "container", "kubernetes"] },
      { name: "SQL", keywords: ["sql", "postgresql", "mysql", "database"] },
      { name: "Tailwind CSS", keywords: ["tailwind", "tailwindcss", "css"] },
      { name: "GraphQL", keywords: ["graphql", "apollo"] },
      { name: "Redux", keywords: ["redux", "zustand", "state management"] },
      { name: "Next.js", keywords: ["next", "next.js", "nextjs"] },
      { name: "Zustand", keywords: ["zustand"] },
      { name: "Git", keywords: ["git", "github", "gitlab"] },
      { name: "Jest", keywords: ["jest", "testing", "unit test"] },
      { name: "Kubernetes", keywords: ["kubernetes", "k8s"] }
    ];

    const softSkillsPool = [
      { name: "Team Leadership", keywords: ["leadership", "lead", "manage"] },
      { name: "Agile Methodologies", keywords: ["agile", "scrum", "kanban"] },
      { name: "Communication", keywords: ["communication", "present", "stakeholders"] },
      { name: "Problem Solving", keywords: ["problem solving", "analytical"] },
      { name: "Mentoring", keywords: ["mentor", "coaching", "guide"] }
    ];

    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];
    const technologies: string[] = [];
    const softSkills: string[] = [];

    allSkills.forEach(skill => {
      if (skill.keywords.some(kw => textLower.includes(kw))) {
        requiredSkills.push(skill.name);
        technologies.push(skill.name);
      }
    });

    softSkillsPool.forEach(skill => {
      if (skill.keywords.some(kw => textLower.includes(kw))) {
        softSkills.push(skill.name);
      }
    });

    // Defaults if none matched
    if (requiredSkills.length === 0) requiredSkills.push("React", "Node.js", "TypeScript");
    if (technologies.length === 0) technologies.push("React", "Node.js", "TypeScript", "Git");
    if (softSkills.length === 0) softSkills.push("Cross-functional Collaboration", "Problem Solving");

    // Add some preferred skills
    if (technologies.includes("React") && !technologies.includes("Next.js")) {
      preferredSkills.push("Next.js");
    }
    if (technologies.includes("Node.js") && !technologies.includes("Docker")) {
      preferredSkills.push("Docker");
    }

    const responsibilities = [
      "Design, develop, and maintain clean, scalable web applications.",
      "Collaborate with UX/UI designers and product managers to translate requirements into code.",
      "Write high-quality, maintainable, and testable code following best practices.",
      "Optimize application performance and resolve bottlenecks."
    ];

    const atsKeywords = [...requiredSkills, ...softSkills, "Agile", "REST APIs", "CI/CD"];
    const actionVerbs = ["Collaborate", "Design", "Implement", "Optimize", "Build", "Deliver"];

    return {
      jobTitle,
      experienceRequired: jdText.match(/\b\d+\+?\s*years?\b/i)?.[0] || "3-5 years",
      requiredSkills,
      preferredSkills,
      responsibilities,
      technologies,
      softSkills,
      atsKeywords,
      actionVerbs,
      industry: "Information Technology"
    };
  }

  private static mockCompare(resume: ResumeJSON, jdAnalysis: JDAnalysis): ResumeCompareResult {
    // 1. Check which skills match
    const resumeSkillsLower = [
      ...resume.skills.languages,
      ...resume.skills.frameworks,
      ...resume.skills.tools,
      ...(resume.skills.databases || []),
      ...(resume.skills.cloud || []),
      ...resume.skills.softSkills
    ].map(s => s.toLowerCase());

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    jdAnalysis.requiredSkills.forEach(skill => {
      if (resumeSkillsLower.some(s => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s))) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    // 2. Generate suggestions
    const suggestions: SuggestionItem[] = [];
    let suggIndex = 1;

    // Suggestion 1: Optimize Professional Summary
    const keywordsToInject = missingSkills.slice(0, 2);
    if (keywordsToInject.length > 0) {
      suggestions.push({
        id: `sugg-${suggIndex++}`,
        category: 'summary',
        title: 'Optimize Professional Summary',
        explanation: 'Add high-priority job keywords directly into your professional summary for better ATS matching.',
        originalText: resume.summary,
        proposedText: `${resume.summary} Proven experience working with ${keywordsToInject.join(' and ')} in production environments.`,
        impactScore: 9
      });
    }

    // Suggestion 2: Reorder skills to prioritize JD requirements
    if (matchedSkills.length > 0) {
      suggestions.push({
        id: `sugg-${suggIndex++}`,
        category: 'skills',
        title: 'Prioritize Job Skills in Skills Section',
        explanation: 'Rearrange languages and frameworks to list the job description\'s requested skills first.',
        impactScore: 7
      });
    }

    // Suggestion 3: Tailor Work Experience (optimizing action verbs)
    if (resume.experience.length > 0) {
      const exp = resume.experience[0];
      const matchingVerb = jdAnalysis.actionVerbs[0] || "Optimize";
      const targetBullet = exp.highlights[0] || "";
      
      suggestions.push({
        id: `sugg-${suggIndex++}`,
        category: 'experience',
        targetId: exp.id,
        title: `Tailor Experience at ${exp.company}`,
        explanation: `Refhrase highlight bullet to start with the JD action verb "${matchingVerb}" and emphasize ATS keywords.`,
        originalText: targetBullet,
        proposedText: `${matchingVerb} the development and deployment of application features, incorporating ${jdAnalysis.requiredSkills[0] || 'core technologies'} for optimized performance.`,
        impactScore: 8
      });
    }

    // Suggestion 4: Highlight Technologies in Projects
    if (resume.projects.length > 0 && missingSkills.length > 0) {
      const proj = resume.projects[0];
      suggestions.push({
        id: `sugg-${suggIndex++}`,
        category: 'projects',
        targetId: proj.id,
        title: `Highlight ${missingSkills[0]} in Project: ${proj.name}`,
        explanation: `Underline the technical implementation and architecture of ${proj.name} using relevant modern frameworks.`,
        originalText: proj.description,
        proposedText: `${proj.description} Leveraged modern workflows and aligned architectural features with ${missingSkills[0]} concepts.`,
        impactScore: 6
      });
    }

    // Match coverage arithmetic
    const keywordCoverage = Math.round((matchedSkills.length / Math.max(1, jdAnalysis.requiredSkills.length)) * 100);
    const atsScore = Math.min(100, Math.max(30, keywordCoverage + 15)); // Add padding for structured experience

    return {
      matchedSkills,
      missingSkills,
      weakSections: missingSkills.length > 2 ? ["Skills Profile", "Professional Summary"] : [],
      keywordCoverage,
      atsScore,
      suggestions
    };
  }

  /**
   * Deterministic programmatic merge of selected suggestions.
   */
  private static programmaticMerge(resume: ResumeJSON, selectedSuggestions: SuggestionItem[]): ResumeJSON {
    // Deep clone the resume to avoid side effects
    const updated = JSON.parse(JSON.stringify(resume)) as ResumeJSON;

    selectedSuggestions.forEach(sugg => {
      // 1. Merge Professional Summary
      if (sugg.category === 'summary' && sugg.proposedText) {
        updated.summary = sugg.proposedText;
      }
      
      // 2. Merge Work Experience Highlights
      if (sugg.category === 'experience' && sugg.targetId && sugg.originalText && sugg.proposedText) {
        const exp = updated.experience.find(e => e.id === sugg.targetId);
        if (exp) {
          const idx = exp.highlights.indexOf(sugg.originalText);
          if (idx !== -1) {
            exp.highlights[idx] = sugg.proposedText;
          } else {
            // fallback: find the most similar highlight
            const fallbackIdx = exp.highlights.findIndex(h => h.includes(sugg.originalText!.substring(0, 10)));
            if (fallbackIdx !== -1) exp.highlights[fallbackIdx] = sugg.proposedText;
          }
        }
      }
      
      // 3. Merge Projects Description
      if (sugg.category === 'projects' && sugg.targetId && sugg.originalText && sugg.proposedText) {
        const proj = updated.projects.find(p => p.id === sugg.targetId);
        if (proj) {
          if (proj.description === sugg.originalText) {
            proj.description = sugg.proposedText;
          } else if (proj.description.includes(sugg.originalText.substring(0, 10))) {
            proj.description = sugg.proposedText;
          }
        }
      }

      // 4. Merge Skills (reordering and adding missing skills)
      if (sugg.category === 'skills') {
        // 4a. Add missing skills programmatically from proposedText or explanation
        const textToSearch = `${sugg.proposedText || ''} ${sugg.explanation || ''}`;
        
        // Define common skill keywords for automatic categorization fallback
        const databaseKeywords = ['mongodb', 'postgresql', 'mysql', 'redis', 'sql', 'nosql', 'oracle', 'sqlite', 'cassandra'];
        const cloudKeywords = ['aws', 'azure', 'gcp', 'google cloud', 'cloud', 'aws s3', 'ec2', 'lambda', 'terraform'];
        const languageKeywords = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'html', 'css', 'bash', 'shell'];
        const frameworkKeywords = ['react', 'angular', 'vue', 'next.js', 'nextjs', 'express', 'django', 'flask', 'spring', 'laravel', 'nest.js', 'nestjs', 'node.js', 'nodejs'];
        
        const words = textToSearch.split(/[\s,./()]+/).map(w => w.trim().toLowerCase()).filter(Boolean);
        const uniqueWords = Array.from(new Set(words));
        
        let explicitSkills: string[] = [];
        if (sugg.proposedText && sugg.proposedText.includes(',')) {
          // If proposedText is a comma-separated list, use it directly
          explicitSkills = sugg.proposedText.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          // Fallback: extract matching keywords from text
          uniqueWords.forEach(w => {
            let matchedSkill: string | null = null;
            if (databaseKeywords.includes(w)) {
              matchedSkill = w === 'mongodb' ? 'MongoDB' : w === 'postgresql' ? 'PostgreSQL' : w === 'mysql' ? 'MySQL' : w === 'redis' ? 'Redis' : w.toUpperCase();
            } else if (cloudKeywords.includes(w)) {
              matchedSkill = w === 'aws' ? 'AWS' : w === 'azure' ? 'Azure' : w === 'gcp' ? 'GCP' : w === 'terraform' ? 'Terraform' : w;
            } else if (languageKeywords.includes(w)) {
              matchedSkill = w === 'javascript' ? 'JavaScript' : w === 'typescript' ? 'TypeScript' : w === 'python' ? 'Python' : w === 'java' ? 'Java' : w === 'go' ? 'Go' : w === 'rust' ? 'Rust' : w;
            } else if (frameworkKeywords.includes(w)) {
              matchedSkill = w === 'react' ? 'React' : w === 'angular' ? 'Angular' : w === 'vue' ? 'Vue' : w === 'next.js' || w === 'nextjs' ? 'Next.js' : w === 'express' ? 'Express' : w === 'django' ? 'Django' : w === 'node.js' || w === 'nodejs' ? 'Node.js' : w;
            }
            
            if (matchedSkill && !explicitSkills.includes(matchedSkill)) {
              explicitSkills.push(matchedSkill);
            }
          });
        }
        
        // Distribute parsed skills to appropriate sections
        explicitSkills.forEach(skill => {
          const lowerSkill = skill.toLowerCase();
          let bucket: string[] = updated.skills.tools; // default fallback bucket
          
          if (databaseKeywords.includes(lowerSkill)) {
            if (!updated.skills.databases) updated.skills.databases = [];
            bucket = updated.skills.databases;
          } else if (cloudKeywords.includes(lowerSkill)) {
            if (!updated.skills.cloud) updated.skills.cloud = [];
            bucket = updated.skills.cloud;
          } else if (languageKeywords.includes(lowerSkill)) {
            bucket = updated.skills.languages;
          } else if (frameworkKeywords.includes(lowerSkill)) {
            bucket = updated.skills.frameworks;
          }
          
          // Only add if not already in the list
          const alreadyExists = [
            ...updated.skills.languages,
            ...updated.skills.frameworks,
            ...updated.skills.tools,
            ...(updated.skills.databases || []),
            ...(updated.skills.cloud || []),
            ...updated.skills.softSkills
          ].some(s => s.toLowerCase() === lowerSkill);
          
          if (!alreadyExists) {
            bucket.push(skill);
          }
        });

        // 4b. Reorder languages and frameworks to prioritize core keywords
        const prioritize = ["React", "TypeScript", "Node.js", "Next.js", "Python"];
        
        updated.skills.languages.sort((a, b) => {
          const aPri = prioritize.includes(a) ? 1 : 0;
          const bPri = prioritize.includes(b) ? 1 : 0;
          return bPri - aPri;
        });

        updated.skills.frameworks.sort((a, b) => {
          const aPri = prioritize.includes(a) ? 1 : 0;
          const bPri = prioritize.includes(b) ? 1 : 0;
          return bPri - aPri;
        });
      }
    });

    return updated;
  }
}
