// 🧪 TEST: Wolfram Alpha API Integration
// This shows exactly how your backend calls Wolfram Alpha

// YOUR CURRENT IMPLEMENTATION (from backend/server.js line 185):
async function analyzeWithWolfram(query, analysisType = 'general') {
  const WOLFRAM_ALPHA_API_KEY = process.env.WOLFRAM_ALPHA_API_KEY;
  const WOLFRAM_ALPHA_BASE_URL = 'https://api.wolframalpha.com/v2/query';

  if (!WOLFRAM_ALPHA_API_KEY) {
    return {
      success: false,
      result: 'Wolfram Alpha analysis unavailable (no API key)',
      analysisType,
    };
  }

  try {
    // ✅ CORRECT: Using appid parameter with your API key
    const response = await fetch(
      `${WOLFRAM_ALPHA_BASE_URL}?input=${encodeURIComponent(
        query
      )}&appid=${WOLFRAM_ALPHA_API_KEY}&format=plaintext&output=JSON&podtitle=Result&podtitle=Solution&podtitle=Timeline&podtitle=Statistics`
    );

    if (!response.ok) {
      throw new Error(`Wolfram Alpha API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.queryresult && data.queryresult.pods) {
      const relevantData = data.queryresult.pods
        .filter(pod => pod.title && pod.subpods && pod.subpods[0].plaintext)
        .map(pod => ({
          title: pod.title,
          content: pod.subpods[0].plaintext,
        }));

      return {
        success: true,
        result: relevantData,
        analysisType,
        query: query,
      };
    }

    return {
      success: false,
      result: 'No relevant analysis found',
      analysisType,
    };
  } catch (error) {
    console.error('Wolfram Alpha API error:', error.message);
    return {
      success: false,
      result: `Analysis failed: ${error.message}`,
      analysisType,
    };
  }
}

// 🎯 EXAMPLE API CALLS YOUR BACKEND WILL MAKE:

// For "integrate x^2":
// GET https://api.wolframalpha.com/v2/query?input=integrate%20x%5E2&appid=YOUR_APPID&format=plaintext&output=JSON&podtitle=Result&podtitle=Solution&podtitle=Timeline&podtitle=Statistics

// For "calories in a big mac":
// GET https://api.wolframalpha.com/v2/query?input=calories%20in%20a%20big%20mac&appid=YOUR_APPID&format=plaintext&output=JSON&podtitle=Result&podtitle=Solution&podtitle=Timeline&podtitle=Statistics

// For "plot sin(x) from 0 to 2π":
// GET https://api.wolframalpha.com/v2/query?input=plot%20sin(x)%20from%200%20to%202%CF%80&appid=YOUR_APPID&format=plaintext&output=JSON&podtitle=Result&podtitle=Solution&podtitle=Timeline&podtitle=Statistics

// ✅ VERIFICATION:
// 1. Using correct parameter name: appid (not api_key)
// 2. Properly encoding queries with encodeURIComponent()
// 3. Requesting JSON output for easy parsing
// 4. Filtering for relevant pods (Result, Solution, Timeline, Statistics)
// 5. Error handling for network failures and missing API key
// 6. Graceful degradation when no results found

// 🚀 STATUS: READY TO SHIP!
// Just add your Wolfram Alpha API key to .env and test!
