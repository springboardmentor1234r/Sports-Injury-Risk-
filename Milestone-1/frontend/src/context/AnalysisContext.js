import { createContext, useState, useEffect } from "react";

export const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {

  // Load latest analysis from localStorage
  const [analysis, setAnalysis] = useState(() => {
    const saved = localStorage.getItem("latestAnalysis");
    return saved ? JSON.parse(saved) : null;
  });

  // Load history from localStorage
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("analysisHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // Save latest analysis whenever it changes
  useEffect(() => {
    if (analysis) {
      localStorage.setItem(
        "latestAnalysis",
        JSON.stringify(analysis)
      );
    }
  }, [analysis]);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "analysisHistory",
      JSON.stringify(history)
    );
  }, [history]);

  // Save a new analysis
  const saveAnalysis = (data) => {

    // Debug backend response
    console.log("========== BACKEND RESPONSE ==========");
    console.log(data);

    const newAnalysis = {
      id: Date.now(),
      createdAt: new Date().toLocaleString(),
      ...data,
    };

    // Debug saved object
    console.log("========== SAVED ANALYSIS ==========");
    console.log(newAnalysis);

    setAnalysis(newAnalysis);

    setHistory((prev) => [
      newAnalysis,
      ...prev,
    ]);
  };

  // Delete an analysis from history
  const deleteHistory = (id) => {

    setHistory((prev) =>
      prev.filter((item) => item.id !== id)
    );

    if (analysis && analysis.id === id) {

      const remaining = history.filter(
        (item) => item.id !== id
      );

      if (remaining.length > 0) {
        setAnalysis(remaining[0]);
      } else {
        setAnalysis(null);
        localStorage.removeItem("latestAnalysis");
      }
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        history,
        saveAnalysis,
        deleteHistory,
        setAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}