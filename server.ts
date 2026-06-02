import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "firebase" });
  });

  // AI-powered Credit & Cashflow Analysis endpoint using gemini-3.5-flash
  app.post("/api/gemini/analyze-account", async (req, res) => {
    try {
      const { assignment } = req.body;
      if (!assignment) {
        res.status(400).json({ error: "Missing assignment data in request body." });
        return;
      }

      console.log("GEMINI_API_KEY check:", {
        configured: !!process.env.GEMINI_API_KEY,
        length: process.env.GEMINI_API_KEY?.length || 0,
        prefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) : "none"
      });

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === "" || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        res.status(500).json({ 
          error: "Gemini API Key is missing or invalid. Please follow these steps to add it:\n1. Click the 'Settings' gear icon or the 'Secrets' tab in the AI Studio editor/sidebar on the top-right.\n2. Add a new secret with the name 'GEMINI_API_KEY'.\n3. Paste your Gemini API key (from https://aistudio.google.com/) as the value, save it, and then retry!" 
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Safeguard and compile input data for prompt
      const textPrompt = `Please analyze the financial and risk health for the following credit applicant assignment. Here are the dossier records:

--- BORROWER GENERAL DETAILS ---
Borrower Name: ${assignment.borrowerName || "N/A"}
Location: ${assignment.location || "N/A"}
Tribe/Region: ${assignment.tribe || "N/A"}
Loan Category: ${assignment.loanCategory || "N/A"}
Account Type: ${assignment.accountType || "N/A"}
Requested Amount: ₱${(assignment.requestedAmount || 0).toLocaleString()}
Interest Rate: ${assignment.intRate || 0}% Flat
Term: ${assignment.term || "N/A"} Months
Mode of Payment (MOP): ${assignment.mop || "N/A"}
Terms of Payment (TOP): ${assignment.top || "N/A"}
MCL Referral: ${assignment.isMCLReferral ? "Yes" : "No"}

--- CREDIT SCORING DETAILS ---
${assignment.creditScore ? `
Total Score/Grade: ${assignment.creditScore.totalGrade || 0} / 100
Risk Score: ${assignment.creditScore.riskScore || 0}%
System Risk Recommendation: ${assignment.creditScore.recommendation || "N/A"}
CI Grading Remarks: "${assignment.creditScore.ciRemarks || ""}"
Section Scores:
- Character: ${assignment.creditScore.sectionGrades?.character || 0}
- Capital: ${assignment.creditScore.sectionGrades?.capital || 0}
- Stability: ${assignment.creditScore.sectionGrades?.stability || 0}
- Business Status: ${assignment.creditScore.sectionGrades?.businessStatus || 0}
- Financial Maturity: ${assignment.creditScore.sectionGrades?.financialMaturity || 0}
- Personal Status: ${assignment.creditScore.sectionGrades?.personalStatus || 0}
` : "No SME category credit scoring data filled yet."}

${assignment.mclCreditScore ? `
Total MCL Score: ${assignment.mclCreditScore.totalScore || 0}
MCL Risk Classification: ${assignment.mclCreditScore.riskClassification || "N/A"}
MCL CI Remarks: "${assignment.mclCreditScore.ciRemarks || ""}"
` : "No MCL specific scoring data filled yet."}

--- EXTERNAL LIABILITIES LIST ---
${assignment.cashflowReport?.liabilities && assignment.cashflowReport.liabilities.length > 0 
  ? assignment.cashflowReport.liabilities.map((l: any, i: number) => 
      `${i + 1}. Source: ${l.source || "N/A"} | Type: ${l.loanType || "N/A"} | Amount: ₱${(l.loanAmount || 0).toLocaleString()} | Amortization: ₱${(l.amortization || 0).toLocaleString()} | Balance: ₱${(l.balance || 0).toLocaleString()} | Status: ${l.status || "N/A"} | Remarks: ${l.remarks || ""}`
    ).join("\n")
  : "No external liabilities declared."}

--- FINANCIAL CASHFLOW RECORDS ---
${assignment.cashflowReport ? `
Business Gross Income: ₱${(assignment.cashflowReport.businessIncome?.gross || 0).toLocaleString()}
Business Expenses: ₱${(assignment.cashflowReport.businessIncome?.expenses || 0).toLocaleString()}
Business Net Income: ₱${(assignment.cashflowReport.businessIncome?.net || 0).toLocaleString()}
Other Active Household Income: ₱${(assignment.cashflowReport.otherIncome || 0).toLocaleString()}
Total Household Declared Expenses: ₱${(assignment.cashflowReport.householdExpenses?.total || assignment.cashflowReport.analysis?.totalHouseholdExpenses || 0).toLocaleString()}
--- CASHFLOW ANALYSIS ---
Net Disposable Income (NDI): ₱${(assignment.cashflowReport.analysis?.monthlyNdi || 0).toLocaleString()}
NDI Percentage Ratio: ${assignment.cashflowReport.analysis?.ndiPercentage || 0}%
Recommended Loan Cap based on NDI: ₱${(assignment.cashflowReport.analysis?.recommendedLoan || 0).toLocaleString()}
Recommended Term of Credit check: ${assignment.cashflowReport.ciRecommendation?.term || "N/A"} Months
CI Recommended Loan Amount: ₱${(assignment.cashflowReport.ciRecommendation?.loanAmount || 0).toLocaleString()}
` : "No financial cashflow diagnostic or monthly statement filled yet."}

--- END OF RECORD ---`;

      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      let response = null;
      let lastError: any = null;
      const maxRetries = 2; // Retry twice on transient errors per model

      for (const modelToTry of modelsToTry) {
        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
          try {
            console.log(`[AI Copilot] Processing analysis via model: ${modelToTry} (Attempt ${attempt}/${maxRetries + 1})`);
            response = await ai.models.generateContent({
              model: modelToTry,
              contents: textPrompt,
              config: {
                systemInstruction: `You are an expert Credit Committee (CRECOM) Senior Financial Analyst and AI Credit Scorer.
Analyze the provided borrower details, scoring criteria, active liabilities, and net disposable cashflow metrics.
Produce a refined, objective, and highly professional Credit Assessment Report.

Structure your markdown report clearly:
### 1. Financial Profile & Capacity Assessment
Summarize monthly Net Disposable Income (NDI) and evaluate if the requested loan (₱${assignment.requestedAmount?.toLocaleString() || 'N/A'}) matches their actual repayment capacity. Note any cashflow anomalies (e.g. expenses too high relative to net income, or too close to recommended caps).

### 2. Credit Scoring & Risk Analysis
Analyze their risk classification/grade (${assignment.creditScore?.finalGrade || assignment.creditScore?.totalGrade || assignment.mclCreditScore?.riskClassification || 'N/A'}) and highlight specific risk elements in stability, business foot traffic, or household criteria. Critically weigh their outstanding external debts (liabilities) and the impact of existing amortizations on the proposed obligation.

### 3. Credit Recommendation & Mitigating Strategy
Express if the loan is fully viable, should be resized/restructured (lower amount or longer term for amortization relief), or conditioned. Specify a suggested approved amount, term (months), monthly amortization range, and list 2-3 specific risk-mitigating strategies (e.g. requiring a co-maker, specific post-dated check security, or periodic site inspections).

Be objective, concise, and business-focused (avoid boilerplate sales jargon). Word count limit: 250-400 words. DO NOT output any system logs, port info, or technical database tracking strings. Keep the tone completely professional, humble, and analytical.`,
                temperature: 0.7,
              }
            });

            if (response && response.text) {
              console.log(`[AI Copilot] Successful generation using ${modelToTry} on attempt ${attempt}`);
              break;
            }
          } catch (modelErr: any) {
            const errString = modelErr.message || String(modelErr);
            console.warn(`[AI Copilot] Model ${modelToTry} attempt ${attempt} encountered error:`, errString);
            lastError = modelErr;

            const isTransient = errString.includes("503") || 
                                errString.includes("UNAVAILABLE") || 
                                errString.includes("429") || 
                                errString.includes("rate limit") ||
                                errString.includes("Service Unavailable") ||
                                errString.includes("high demand");

            if (isTransient && attempt <= maxRetries) {
              const backoffTime = attempt * 1200; // linear/exponential sleep
              console.log(`[AI Copilot] Transient error encountered. Backing off for ${backoffTime}ms before retrying ${modelToTry}...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            } else {
              break; // break the attempt loop to move on to next model
            }
          }
        }

        if (response && response.text) {
          break; // break the model loop since we got a valid response
        }
      }

      if (!response || !response.text) {
        throw new Error(lastError ? lastError.message : "All available Gemini models are currently experiencing high demand. Please try again in a few moments.");
      }

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error("Gemini analysis error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error during Gemini processing" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
