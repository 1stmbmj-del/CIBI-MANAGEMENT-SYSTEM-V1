import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Simple CORS setup
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { assignment } = req.body;
    if (!assignment) {
      res.status(400).json({ error: "Missing assignment data in request body." });
      return;
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      ""
    ).trim();

    if (!apiKey || apiKey === "" || apiKey === "MY_GEMINI_API_KEY") {
      res.status(500).json({ 
        error: "Gemini API Key is missing or invalid in Vercel environment variables.\n\n" +
               "Please follow these exact steps to resolve this:\n" +
               "1. Go to your Vercel Dashboard (https://vercel.com/) and open your project.\n" +
               "2. Go to 'Settings' > 'Environment Variables'.\n" +
               "3. Add a new variable with Key: GEMINI_API_KEY and Value: (your actual API key starting with AIzaSy... from Google AI Studio).\n" +
               "4. ⚠️ IMPORTANT: In Vercel, serverless containers do not automatically load new environment variables. You MUST trigger a redeploy of your project! Go to the 'Deployments' tab, click the three dots (...) on your latest deployment, select 'Redeploy', and click the Redeploy button."
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
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

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];
    let response = null;
    let lastError: any = null;

    // First pass: try each model once with no retries (failover fast!)
    for (const modelToTry of modelsToTry) {
      try {
        console.log(`[Vercel Serverless] Processing analysis via model: ${modelToTry}`);
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

### 2. Credit Scoring, Risk Analysis & Future Risk Exposure
Analyze their risk classification/grade (${assignment.creditScore?.finalGrade || assignment.creditScore?.totalGrade || assignment.mclCreditScore?.riskClassification || 'N/A'}) and highlight specific risk elements in stability, business foot traffic, or household criteria. Critically weigh their outstanding external debts (liabilities) and the impact of existing amortizations on the proposed obligation.
Furthermore, analyze and describe the possible future risks based on the gathered data (e.g., potential cashflow disruptions, default susceptibility under income volatility, credit-phasing liabilities stress, or micro-economic dependencies of their tribal/regional location).

### 3. Credit Recommendation & Mitigating Strategy
Express if the loan is fully viable, should be resized/restructured (lower amount or longer term for amortization relief), or conditioned. Specify a suggested approved amount, term (months), monthly amortization range, and list 2-3 specific risk-mitigating strategies (e.g. requiring a co-maker, specific post-dated check security, or periodic site inspections).

### 4. Summary Report
Provide a clean bulleted-list summary of the primary indicators:
- **Borrower Profile:** ${assignment.borrowerName || "N/A"} (${assignment.location || "N/A"})
- **Requested Obligation:** ₱${(assignment.requestedAmount || 0).toLocaleString()} for ${assignment.term || "N/A"} months (${assignment.mop || "N/A"})
- **Net Disposable monthly Income (NDI):** ₱${(assignment.cashflowReport?.analysis?.monthlyNdi || 0).toLocaleString()} (${assignment.cashflowReport?.analysis?.ndiPercentage || 0}% ratio)
- **Risk Evaluation Grade:** ${assignment.creditScore?.finalGrade || assignment.creditScore?.totalGrade || assignment.mclCreditScore?.riskClassification || 'N/A'}
- **Automated Score Recommendation:** ${assignment.creditScore?.recommendation || "N/A"}
- **CI Recommended Loan Allocation:** ₱${(assignment.cashflowReport?.ciRecommendation?.loanAmount || 0).toLocaleString()} for ${assignment.cashflowReport?.ciRecommendation?.term || "N/A"} months

Be objective, concise, and business-focused (avoid boilerplate sales jargon). Word count limit: 300-500 words. DO NOT output any system logs, port info, or technical database tracking strings. Keep the tone completely professional, humble, and analytical.`,
            temperature: 0.7,
          }
        });

        if (response && response.text) {
          console.log(`[Vercel Serverless] Successful generation using ${modelToTry}`);
          break;
        }
      } catch (modelErr: any) {
        console.warn(`[Vercel Serverless] Model ${modelToTry} failed on first pass:`, modelErr.message || modelErr);
        lastError = modelErr;
      }
    }

    // Second pass: if all models failed, try a single retry with a short backoff for each model
    if (!response || !response.text) {
      console.log("[Vercel Serverless] All models failed on first pass. Initiating second pass with brief retries...");
      for (const modelToTry of modelsToTry) {
        try {
          console.log(`[Vercel Serverless] Pass 2: Retrying model: ${modelToTry} after brief backoff...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
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

### 2. Credit Scoring, Risk Analysis & Future Risk Exposure
Analyze their risk classification/grade (${assignment.creditScore?.finalGrade || assignment.creditScore?.totalGrade || assignment.mclCreditScore?.riskClassification || 'N/A'}) and highlight specific risk elements in stability, business foot traffic, or household criteria. Critically weigh their outstanding external debts (liabilities) and the impact of existing amortizations on the proposed obligation.
Furthermore, analyze and describe the possible future risks based on the gathered data (e.g., potential cashflow disruptions, default susceptibility under income volatility, credit-phasing liabilities stress, or micro-economic dependencies of their tribal/regional location).

### 3. Credit Recommendation & Mitigating Strategy
Express if the loan is fully viable, should be resized/restructured (lower amount or longer term for amortization relief), or conditioned. Specify a suggested approved amount, term (months), monthly amortization range, and list 2-3 specific risk-mitigating strategies (e.g. requiring a co-maker, specific post-dated check security, or periodic site inspections).

### 4. Summary Report
Provide a clean bulleted-list summary of the primary indicators:
- **Borrower Profile:** ${assignment.borrowerName || "N/A"} (${assignment.location || "N/A"})
- **Requested Obligation:** ₱${(assignment.requestedAmount || 0).toLocaleString()} for ${assignment.term || "N/A"} months (${assignment.mop || "N/A"})
- **Net Disposable monthly Income (NDI):** ₱${(assignment.cashflowReport?.analysis?.monthlyNdi || 0).toLocaleString()} (${assignment.cashflowReport?.analysis?.ndiPercentage || 0}% ratio)
- **Risk Evaluation Grade:** ${assignment.creditScore?.finalGrade || assignment.creditScore?.totalGrade || assignment.mclCreditScore?.riskClassification || 'N/A'}
- **Automated Score Recommendation:** ${assignment.creditScore?.recommendation || "N/A"}
- **CI Recommended Loan Allocation:** ₱${(assignment.cashflowReport?.ciRecommendation?.loanAmount || 0).toLocaleString()} for ${assignment.cashflowReport?.ciRecommendation?.term || "N/A"} months

Be objective, concise, and business-focused (avoid boilerplate sales jargon). Word count limit: 300-500 words. DO NOT output any system logs, port info, or technical database tracking strings. Keep the tone completely professional, humble, and analytical.`,
              temperature: 0.7,
            }
          });

          if (response && response.text) {
            console.log(`[Vercel Serverless] Successful generation using ${modelToTry} on second pass`);
            break;
          }
        } catch (modelErr: any) {
          console.warn(`[Vercel Serverless] Model ${modelToTry} failed on second pass:`, modelErr.message || modelErr);
          lastError = modelErr;
        }
      }
    }

    if (!response || !response.text) {
      throw new Error(lastError ? lastError.message : "All available Gemini models are currently experiencing high demand. Please try again in a few moments.");
    }

    res.status(200).json({ analysis: response.text });
  } catch (err: any) {
    console.error("Vercel Serverless Gemini analysis error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error during Gemini processing" });
  }
}
