import { Router } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { OpenAIService } from '../services/openai.service';
import { DocxService } from '../services/docx.service';
import { PdfService } from '../services/pdf.service';
import { Resume } from '../models/resume.model';
import { 
  AnalyzeJDRequestSchema, 
  CompareRequestSchema, 
  ApplySuggestionsRequestSchema,
  ResumeJSONSchema
} from '../schemas/validation.schemas';

export const apiRouter = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

/**
 * @openapi
 * /api/analyze-jd:
 *   post:
 *     summary: Analyze Job Description
 *     description: Extract structured skills, technologies, and requirements from a raw text Job Description.
 *     tags: [AI Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jdText
 *             properties:
 *               jdText:
 *                 type: string
 *                 description: Raw Job Description text
 *                 example: "Looking for a Senior React Developer with Node.js and AWS experience."
 *     responses:
 *       200:
 *         description: Job description successfully analyzed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobTitle:
 *                   type: string
 *                 experienceRequired:
 *                   type: string
 *                 requiredSkills:
 *                   type: array
 *                   items:
 *                     type: string
 *                 preferredSkills:
 *                   type: array
 *                   items:
 *                     type: string
 *                 responsibilities:
 *                   type: array
 *                   items:
 *                     type: string
 *                 technologies:
 *                   type: array
 *                   items:
 *                     type: string
 *                 softSkills:
 *                   type: array
 *                   items:
 *                     type: string
 *                 atsKeywords:
 *                   type: array
 *                   items:
 *                     type: string
 *                 actionVerbs:
 *                   type: array
 *                   items:
 *                     type: string
 *                 industry:
 *                   type: string
 *       400:
 *         description: Invalid request payload.
 */
apiRouter.post('/analyze-jd', async (req, res) => {
  try {
    const body = AnalyzeJDRequestSchema.parse(req.body);
    const analysis = await OpenAIService.analyzeJD(body.jdText, body.modelId);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error in /analyze-jd route:', error);
    res.status(400).json({ error: error.errors ? error.errors : error.message });
  }
});

/**
 * @openapi
 * /api/compare:
 *   post:
 *     summary: Compare Resume with Job Description
 *     description: Score the keyword coverage, highlight missing skills, and suggest AI modifications.
 *     tags: [AI Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *               - jdAnalysis
 *             properties:
 *               resume:
 *                 type: object
 *                 description: Structured Resume JSON
 *               jdAnalysis:
 *                 type: object
 *                 description: Parsed Job Description analysis
 *     responses:
 *       200:
 *         description: Comparison audit successfully completed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matchedSkills:
 *                   type: array
 *                   items:
 *                     type: string
 *                 missingSkills:
 *                   type: array
 *                   items:
 *                     type: string
 *                 weakSections:
 *                   type: array
 *                   items:
 *                     type: string
 *                 keywordCoverage:
 *                   type: number
 *                 atsScore:
 *                   type: number
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       category:
 *                         type: string
 *                       targetId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       explanation:
 *                         type: string
 *                       originalText:
 *                         type: string
 *                       proposedText:
 *                         type: string
 *                       impactScore:
 *                         type: number
 *       400:
 *         description: Invalid input schemas.
 */
apiRouter.post('/compare', async (req, res) => {
  try {
    const body = CompareRequestSchema.parse(req.body);
    const comparison = await OpenAIService.compareResumeWithJD(body.resume, body.jdAnalysis, body.modelId);
    res.json(comparison);
  } catch (error: any) {
    console.error('Error in /compare route:', error);
    res.status(400).json({ error: error.errors ? error.errors : error.message });
  }
});

/**
 * @openapi
 * /api/apply-suggestions:
 *   post:
 *     summary: Apply Selected AI Suggestions
 *     description: Merges user-approved recommendations into the Resume JSON.
 *     tags: [AI Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *               - selectedSuggestions
 *             properties:
 *               resume:
 *                 type: object
 *                 description: Structured Resume JSON
 *               selectedSuggestions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   description: Suggestion items to merge
 *     responses:
 *       200:
 *         description: Suggestions successfully applied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedResume:
 *                   type: object
 *       400:
 *         description: Invalid payload.
 */
apiRouter.post('/apply-suggestions', async (req, res) => {
  try {
    const body = ApplySuggestionsRequestSchema.parse(req.body);
    const updated = await OpenAIService.applySuggestions(body.resume, body.selectedSuggestions, body.modelId);
    
    if (body.resume._id) {
      await Resume.findByIdAndUpdate(body.resume._id, {
        resumeData: updated
      });
      updated._id = body.resume._id;
      updated.fileName = body.resume.fileName;
    }
    
    res.json({ updatedResume: updated });
  } catch (error: any) {
    console.error('Error in /apply-suggestions route:', error);
    res.status(400).json({ error: error.errors ? error.errors : error.message });
  }
});

/**
 * @openapi
 * /api/resumes:
 *   get:
 *     summary: List Stored Resumes
 *     tags: [Resumes]
 *     responses:
 *       200:
 *         description: Resumes listed successfully.
 */
apiRouter.get('/resumes', async (req, res) => {
  try {
    const docs = await Resume.find({}, { fileName: 1, 'resumeData.personalInfo.fullName': 1, updatedAt: 1 }).sort({ updatedAt: -1 });
    const list = docs.map(doc => ({
      _id: doc._id.toString(),
      fileName: doc.fileName,
      fullName: doc.resumeData?.personalInfo?.fullName || 'Unknown',
      updatedAt: doc.updatedAt
    }));
    res.json(list);
  } catch (error: any) {
    console.error('Error in GET /resumes route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/resumes/{id}:
 *   get:
 *     summary: Fetch Stored Resume
 *     tags: [Resumes]
 */
apiRouter.get('/resumes/:id', async (req, res) => {
  try {
    const doc = await Resume.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    const resumeData = {
      ...doc.resumeData,
      _id: doc._id.toString(),
      fileName: doc.fileName
    };
    res.json(resumeData);
  } catch (error: any) {
    console.error('Error in GET /resumes/:id route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/resumes/{id}:
 *   put:
 *     summary: Update Stored Resume
 *     tags: [Resumes]
 */
apiRouter.put('/resumes/:id', async (req, res) => {
  try {
    const resumeData = ResumeJSONSchema.parse(req.body);
    const doc = await Resume.findByIdAndUpdate(req.params.id, {
      resumeData: resumeData
    }, { new: true });
    
    if (!doc) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    const updatedResume = {
      ...doc.resumeData,
      _id: doc._id.toString(),
      fileName: doc.fileName
    };
    res.json({ updatedResume });
  } catch (error: any) {
    console.error('Error in PUT /resumes/:id route:', error);
    res.status(400).json({ error: error.errors ? error.errors : error.message });
  }
});

/**
 * @openapi
 * /api/resumes/{id}:
 *   delete:
 *     summary: Delete Stored Resume
 *     tags: [Resumes]
 */
apiRouter.delete('/resumes/:id', async (req, res) => {
  try {
    const doc = await Resume.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /resumes/:id route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/export/docx:
 *   post:
 *     summary: Export Resume to DOCX
 *     description: Converts Resume JSON into a download stream for Word (.docx).
 *     tags: [Export Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Structured Resume JSON
 *     responses:
 *       200:
 *         description: DOCX generated successfully.
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid resume schema.
 */
apiRouter.post('/export/docx', async (req, res) => {
  try {
    const resume = ResumeJSONSchema.parse(req.body);
    const buffer = await DocxService.generate(resume);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Tailored_Resume.docx"');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error in /export/docx route:', error);
    res.status(400).json({ error: error.errors ? error.errors : error.message });
  }
});

/**
 * @openapi
 * /api/export/pdf:
 *   post:
 *     summary: Export Resume to PDF
 *     description: Converts Resume JSON into a download stream for PDF.
 *     tags: [Export Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Structured Resume JSON
 *     responses:
 *       200:
 *         description: PDF generated successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid resume schema.
 */
apiRouter.post('/export/pdf', async (req, res) => {
  try {
    const resume = ResumeJSONSchema.parse(req.body);
    const buffer = await PdfService.generate(resume);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Tailored_Resume.pdf"');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error in /export/pdf route:', error);
    res.status(400).json({ error: error.errors ? error.errors : error.message });
  }
});

/**
 * @openapi
 * /api/import-resume:
 *   post:
 *     summary: Import Resume from PDF
 *     description: Uploads a PDF resume, parses its text, and converts it to structured Resume JSON.
 *     tags: [Import Services]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file of the resume
 *     responses:
 *       200:
 *         description: Resume parsed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Parsing failed.
 */
apiRouter.post('/import-resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const parser = new PDFParse({ data: req.file.buffer });
    const parsedPdf = await parser.getText();
    const resumeText = parsedPdf.text;
    
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: 'Failed to extract text from PDF resume' });
    }

    const modelId = req.body.modelId;
    const parsedJSON = await OpenAIService.parseResumeText(resumeText, modelId);
    
    // Save imported resume to MongoDB
    const resumeDoc = new Resume({
      fileName: req.file.originalname,
      resumeData: parsedJSON
    });
    await resumeDoc.save();

    const returnedJSON = {
      ...parsedJSON,
      _id: resumeDoc._id.toString(),
      fileName: resumeDoc.fileName
    };

    res.json(returnedJSON);
  } catch (error: any) {
    console.error('Error in /import-resume route:', error);
    res.status(500).json({ error: error.message || 'Internal server error during PDF parsing' });
  }
});
