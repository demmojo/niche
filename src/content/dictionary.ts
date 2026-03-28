export type LocalizedString = string & { readonly __brand: unique symbol };

export function tMessage(copy: string): LocalizedString {
  return copy as LocalizedString;
}

export const dictionary = {
  tooltips: {
    dashboard: {
      scanNews: "Scan for latest news and product launches",
      checkIntegrity: "Check data integrity and validate external systems",
      processData: "Process raw data into structured insights",
      clearLogs: "Clear all system logs",
      retryAction: "Retry this failed action",
    },
    insight: {
      discard: "Discard new insight",
      save: "Save this new insight to the library",
      addManual: "Manually add a new insight",
      edit: "Edit this insight",
      delete: "Delete this insight",
      brainstorm: "Chat with AI to discover new insights",
      cancelEdit: "Cancel editing",
      saveChanges: "Save changes to this insight",
      saveSuggested: "Save this suggested insight to your library",
      insightAdded: "Insight already added",
    },
    marketAnalysis: {
      askAiData: "Ask AI to analyze the current page's data",
      generateStories: "Ask AI to generate user stories based on context",
    },
    matrix: {
      aggregateFeatures:
        "Find and aggregate similar features into unique capabilities",
      exportMarkdown: "Export matrix data as Markdown",
      suggestFeature:
        "Let AI recommend the next feature to build based on market gaps",
      filterData: "Filter Data",
      exportCsv: "Export as CSV",
      addToProduct: "Add to Our Product",
      collapseDetails: "Collapse details",
      viewDetails: "View feature details",
      openSourceLink: "Open source link",
      generateStories:
        "Use AI to generate user stories and tasks for this feature",
      prevPage: "Go to previous page",
      nextPage: "Go to next page",
    },
    rawData: {
      upload: "Upload raw data for AI analysis",
      export: "Export raw data to CSV, TXT, or Clipboard",
    },
    navigation: {
      pageGuide: "Page Guide",
      returnMatrix: "Return to the Competitor Matrix",
      returnRawData: "Return to the Raw Data Library",
      returnDashboard: "Return to the Main Dashboard",
    },
    common: {
      closeModal: "Close modal",
      fetchRealTime: "Fetch real-time data and run AI analysis",
      downloadImage: "Open image in a new tab to download",
      copySource: "Copy excerpt text and source URL to clipboard",
    },
    notebook: {
      executeCells: "Execute all calculation cells sequentially",
    },
    brainstorm: {
      close: "Close Brainstorm",
      sendMessage: "Send message",
    },
    quest: {
      close: "Close quest",
    },
    mail: {
      checkMail: "Check interdepartmental mail",
      closeMail: "Close mailbox",
    },
  },
  common: {
    actions: {
      closeModal: "Close modal",
      saveChanges: "Save changes",
      cancelEditing: "Cancel editing",
      exportData: "Export data",
      delete: "Delete",
      edit: "Edit",
      send: "Send message",
    },
  },
  dashboard: {
    guide: {
      title: "Dashboard",
      description:
        "Your command center. Get an instant read on the market landscape and spot immediate opportunities.",
      capabilities: {
        marketContext: {
          title: "Market Context",
          desc: "High-level summary of the current landscape.",
        },
        strategicInsights: {
          title: "Strategic Insights",
          desc: "Auto-generated gaps and emerging threats.",
        },
        competitorLandscape: {
          title: "Competitor Landscape",
          desc: "See who is dominating and who is vulnerable.",
        },
      },
      steps: {
        step1: "Review the high-level market summary.",
        step2: "Check the latest strategic insights for actionable gaps.",
        step3: "Use the Global Sync button to refresh all data.",
      },
      proTip:
        "Use the Global Sync button to ensure all your data is up-to-date before a major strategy session.",
    },
  },
  myProduct: {
    guide: {
      title: "My Product",
      description:
        "Your blueprint. Manage your product details, track features, and orchestrate strategy.",
      capabilities: {
        featureTracking: {
          title: "Feature Tracking",
          desc: "Define your features and track implementation status.",
        },
        aiStrategy: {
          title: "AI Strategy",
          desc: "Let AI suggest strategic next steps based on competitors.",
        },
        openSpecExport: {
          title: "OpenSpec Export",
          desc: "Generate a PRD, One-Pager, or OpenSpec archive.",
        },
      },
      steps: {
        step1: "Fill in your product details and target regions.",
        step2: "Add features manually or track them from the matrix.",
        step3: "Click Generate Docs to export an OpenSpec PRD or archive.",
      },
      proTip:
        "Use the Generate Docs wizard to instantly produce structured markdown documentation that you can hand straight to your engineering team.",
    },
  },
  matrix: {
    guide: {
      title: "Competitor Matrix",
      description:
        "The battlefield. Compare features side-by-side to find where you can outmaneuver the competition.",
      capabilities: {
        aiAggregation: {
          title: "AI Aggregation",
          desc: "Merge similar features into unified capabilities.",
        },
        featureSuggestions: {
          title: "Feature Suggestions",
          desc: "Get AI recommendations based on market gaps.",
        },
        userStoryGeneration: {
          title: "User Story Generation",
          desc: "Turn features into actionable Agile user stories.",
        },
      },
      steps: {
        step1: "Select competitors to compare side-by-side.",
        step2: 'Click "Aggregate Capabilities" to clean up the matrix.',
        step3: "Expand a feature row to generate User Stories & Tasks.",
      },
      proTip:
        'Click "Suggest Feature" to let AI automatically recommend the next feature you should build based on market gaps.',
    },
  },
  rawData: {
    guide: {
      title: "Raw Data Library",
      description:
        "The evidence room. Every insight is backed by raw data collected from the web.",
      capabilities: {
        dataIngestion: {
          title: "Data Ingestion",
          desc: "Upload CSV, JSON, or TXT files.",
        },
        dataExport: {
          title: "Data Export",
          desc: "Export datasets to CSV or JSON formats.",
        },
        sourceTracking: {
          title: "Source Tracking",
          desc: "Verify the original context of any data point.",
        },
      },
      steps: {
        step1: "Upload your own research or scraped data.",
        step2: "Filter by source type or company.",
        step3: "Export datasets for external analysis.",
      },
      proTip:
        "The AI engine uses this raw data to generate all insights. The better your data, the sharper your strategy.",
    },
  },
  reports: {
    guide: {
      title: "Insight Library",
      description:
        "Your strategy vault. Track, refine, and act on the most important market discoveries.",
      capabilities: {
        aiBrainstorming: {
          title: "AI Brainstorming",
          desc: "Chat with AI to flesh out raw ideas.",
        },
        impactScoring: {
          title: "Impact Scoring",
          desc: "Instantly see which insights matter most.",
        },
        dataExport: {
          title: "Data Export",
          desc: "Export filtered insights to CSV.",
        },
      },
      steps: {
        step1: "Review auto-generated insights.",
        step2: "Filter by Opportunity or Threat.",
        step3: "Export insights for your product roadmap.",
      },
      proTip:
        'Click the "Brainstorm" button on any insight to open a dedicated chat session focused entirely on that specific strategic angle.',
    },
  },
  marketAnalysis: {
    guide: {
      title: "Market Analysis",
      description:
        "The big picture. Toggle between conversational AI analysis and an interactive competitor data grid. Let AI proactively analyze your synchronized market data.",
      capabilities: {
        autoSwot: {
          title: "Auto-SWOT",
          desc: "Generates Strengths, Weaknesses, Opportunities, Threats.",
        },
        dataGrid: {
          title: "Data Grid",
          desc: "Sort, filter, and inline-edit competitor data.",
        },
        aiChat: {
          title: "Proactive AI Research Partner",
          desc: "Discuss market shifts with Lens, our AI Product Strategist, who automatically analyzes your newly synced data and drafts features and insights.",
        },
      },
      steps: {
        step1: "Run a Global Sync to pull the latest market data.",
        step2: "Review Lens's proactive deep analysis of the fresh data.",
        step3:
          "Use the inline buttons to instantly save suggested features and insights.",
      },
      proTip:
        "You can instantly synthesize a long conversation into a strategic takeaway by clicking the 'Generate Insight' button below the chat options.",
    },
  },
  mindmap: {
    guide: {
      title: "Visual Whiteboard",
      description:
        "The interactive ecosystem view. Visually map out how competitors, features, and segments connect, and brainstorm with an integrated AI chat.",
      capabilities: {
        interactiveNodes: {
          title: "Whiteboard Canvas",
          desc: "Drag and drop cards, create bi-directional edges, and switch between multiple boards.",
        },
        aiInsights: {
          title: "Contextual AI Chat",
          desc: "Chat directly on the board. Use @mention to reference specific cards in your prompts.",
        },
        relationshipMapping: {
          title: "Templates & Pinning",
          desc: "Start fast with built-in templates, and pin AI responses as new cards instantly.",
        },
      },
      steps: {
        step1: "Select a template or start from scratch.",
        step2: "Double-click to create new cards, drag edges to connect them.",
        step3:
          "Open the AI Chat, @mention a card, and pin the answer to the board.",
      },
      proTip:
        'Need inspiration? Use the AI Chat to "Analyze @competitor" and then hit "Pin to Board" to map out their strategy.',
    },
  },
  actions: {
    guide: {
      title: "Background Tasks & Sync",
      description:
        "The engine room. Monitor system health, data syncs, and review pending changes.",
      capabilities: {
        systemHealth: {
          title: "System Health",
          desc: "See what is running, pending, or failed.",
        },
        globalProgress: {
          title: "Global Progress",
          desc: "Monitor task progress globally via the top-level sticky banner.",
        },
        detailedLogs: {
          title: "Detailed Logs",
          desc: "View the JSON of system events (sanitized for non-superadmins).",
        },
      },
      steps: {
        step1: "Check the current System State.",
        step2: "Review any pending sync changes in the queue.",
        step3: "Run a System Check to validate external APIs.",
      },
      proTip:
        "You can safely navigate away from this tab while a Global Sync is running! The Global Progress Banner at the top of the screen will keep you informed of the background task progress.",
    },
  },
  settings: {
    guide: {
      title: "Settings",
      description:
        "Configure your workspace. Manage your API keys, team members, and data preferences.",
      capabilities: {
        teamCollaboration: {
          title: "Team Collaboration",
          desc: "Invite colleagues via email to your workspace.",
        },
        apiConfiguration: {
          title: "API Configuration",
          desc: "Bring your own keys (BYOK) and configure AI fallbacks.",
        },
        apiUsageLimits: {
          title: "API Usage Limits",
          desc: "Track your daily usage across providers.",
        },
      },
      steps: {
        step1: "Switch between General and Team tabs.",
        step2: "Invite colleagues to collaborate securely.",
        step3: "Configure your AI models and backup fallbacks.",
      },
      proTip:
        "You can manage multiple products in the same workspace using the product dropdown in the top navigation bar!",
    },
  },
  support: {
    guide: {
      title: "Support & Feedback",
      description:
        "Get help or share your ideas. We are building this for you.",
      capabilities: {
        directFeedback: {
          title: "Direct Feedback",
          desc: "Submit bugs or feature requests directly to our team.",
        },
        alphaLimits: {
          title: "Alpha Limits",
          desc: "Request increases to your daily API usage limits.",
        },
        statusTracking: {
          title: "Status Tracking",
          desc: "Know when your feedback has been received.",
        },
      },
      steps: {
        step1: "Select the type of feedback (Bug, Feature, Limit Request).",
        step2: "Provide detailed information so we can help you faster.",
        step3: "Submit and let our team handle the rest.",
      },
      proTip:
        'If you are hitting Alpha Usage Limits, use the "Limit Increase Request" to tell us about your use case, and we might bump your quota!',
    },
  },
  superadmin: {
    guide: {
      title: "Superadmin Dashboard",
      description:
        "Internal tool for reviewing Alpha feedback and managing the system.",
      capabilities: {
        feedbackReview: {
          title: "Feedback Review",
          desc: "Read feedback from all alpha testers.",
        },
        triage: {
          title: "Triage",
          desc: "Prioritize bug reports and feature requests.",
        },
        exemptions: {
          title: "Exemptions",
          desc: "Superadmins bypass all Alpha Usage Limits.",
        },
      },
      steps: {
        step1: "Review the latest feedback from the community.",
        step2: "Identify critical bugs that need immediate fixing.",
        step3: "Review Limit Increase Requests.",
      },
      proTip:
        "Feedback is ordered by newest first, so you can always see what testers are struggling with right now.",
    },
  },
  whiteboard: {
    tour: {
      step_multiple_whiteboards: {
        title: "Multiple Whiteboards",
        content:
          "Create distinct visual workspaces using predefined templates like SWOT or User Journey Maps to organize different strategy sessions.",
      },
      step_infinite_canvas: {
        title: "Infinite Canvas",
        content:
          "Pan, zoom, and drag cards freely. Draw visual links between cards by dragging the circular handles on their edges.",
      },
      step_visual_tagging: {
        title: "Visual Tagging",
        content:
          "Cards exist in a global library. Add tags (like #pricing) to categorize them conceptually across different whiteboards.",
      },
      step_contextual_ai_chat: {
        title: "Contextual AI Chat",
        content:
          'Type "@" to mention specific tags or cards. The AI will instantly read those cards and use them as context to answer your questions.',
      },
      step_pin_ai_insights: {
        title: "Pin AI Insights",
        content:
          'When the AI generates a valuable strategy or idea, click "Pin to Board" to instantly turn it into a new card on your active whiteboard.',
      },
    },
  },
};
