export type Language = 'en' | 'ta';

export const translations = {
  en: {
    appTitle: "AgriRoute",
    appSubtitle: "AI-Based Perishable Produce Transportation Optimizer",
    tagline: "Minimizing total economic loss across transport cost, travel time, and crop spoilage.",
    heroTitle: "Ship Fresh. Cut Spoilage. Maximize Farmer Profits.",
    heroDesc: "The shortest road is not always the best route. AgriRoute calculates agricultural edge weights with crop respiration, ambient temperature, toll tariffs, and traffic patterns to find the truly optimal route.",
    planShipmentCta: "Plan a Shipment",
    demoScenarioCta: "Load Demo (Pollachi 5t Tomato)",
    
    // 3 Cards
    card1Title: "Shortest ≠ Best",
    card1Desc: "A route that saves 15 km of diesel but gets stuck in 2 hours of heat will destroy far more value in withered produce than it saves on fuel.",
    card2Title: "Spoilage-Aware Decay",
    card2Desc: "Exponential biological decay models tailored to Tamil Nadu climate, active refrigeration factors, and crop-specific respiration rates.",
    card3Title: "Fully Transparent & Explainable",
    card3Desc: "No black-box decisions. View exact rupees breakdown between fuel, tolls, wear, driver wages, and expected harvest spoilage.",

    // Form
    plannerTitle: "Shipment Parameters",
    cropLabel: "Perishable Crop",
    quantityLabel: "Quantity (kg)",
    originLabel: "Farm Origin Location",
    originPlaceholder: "Search village (e.g., Pollachi, Anaimalai) or click map",
    destinationLabel: "Destination Market",
    vehicleLabel: "Vehicle Specification",
    departureTimeLabel: "Departure Time",
    maxHoursLabel: "Max Acceptable Travel Hours (Optional)",
    priceOverrideLabel: "Wholesale Market Price (₹/kg)",
    fuelOverrideLabel: "Diesel Price (₹/L)",
    optimizeBtn: "Calculate Optimal Route",
    optimizingBtn: "Evaluating candidate routes & decay...",
    
    // Validation
    errQuantityZero: "Quantity must be greater than 0 kg.",
    errExceedCapacity: "Payload exceeds selected vehicle's capacity. Switch vehicle or use multi-truck.",
    errMissingOrigin: "Please specify farm origin location.",
    errMissingDest: "Please select a destination market.",

    // Results
    resultsTitle: "Route Evaluation & Recommendation",
    recommendedBadge: "Recommended Choice",
    estimatedBadge: "Estimated",
    routeComparison: "Route Comparison",
    colRoute: "Route",
    colDistance: "Distance",
    colTime: "Duration (ETA)",
    colTransportCost: "Transport Cost",
    colSpoilage: "Spoilage Risk",
    colExpectedLoss: "Expected Loss",
    colTotalLoss: "Total Economic Cost",
    colScore: "Score",
    whyThisRoute: "Why this route? (Weight breakdown)",
    assumptionsNotice: "Assumptions & Data Transparency",
    assumptionsSub: "Demonstration assumption: Spoilage rates, ambient temperatures, and traffic multipliers are calibrated for algorithmic demonstration.",
    
    // Tabs
    tabPlanner: "Shipment Planner",
    tabVrp: "Multi-Truck (VRP)",
    tabHistory: "Shipment History",
    tabAdmin: "Data & Rates",

    // VRP
    vrpTitle: "Multi-Farm Pickup & Multi-Truck Allocation",
    vrpDesc: "Consolidate harvests from multiple regional farms into optimal truck routes using Google OR-Tools VRP constraints.",
    solveVrpBtn: "Solve Multi-Truck Allocation",

    // History
    historyTitle: "Past Shipment Records",
    exportCsv: "Export CSV",
    noHistory: "No shipments planned yet. Run an optimization to record.",
  },
  ta: {
    appTitle: "அக்ரி ரூட் (AgriRoute)",
    appSubtitle: "அழுகக்கூடிய விளைபொருள் போக்குவரத்து உகப்பாக்கி",
    tagline: "போக்குவரத்து செலவு, பயண நேரம் மற்றும் விளைபொருள் அழுகல் இழப்பைக் குறைக்கும் வழிகாட்டி.",
    heroTitle: "புதிய விளைபொருள். குறைந்த இழப்பு. அதிக லாபம்.",
    heroDesc: "குறுகிய சாலை எப்போதும் சிறந்த பாதை அல்ல. AgriRoute பயிரின் ஆயுள், வெயில் வெப்பநிலை, சுங்கக்கட்டணம் மற்றும் போக்குவரத்து நெரிசலை கணக்கிட்டு உகந்த பாதையை கண்டறிகிறது.",
    planShipmentCta: "பாதை திட்டமிடுங்கள்",
    demoScenarioCta: "மாதிரி தரவு (பொள்ளாச்சி 5 டன் தக்காளி)",

    // 3 Cards
    card1Title: "குறுகிய தூரம் ≠ சிறந்த பாதை",
    card1Desc: "15 கி.மீ டீசல் சேமிக்கும் குறுகிய சாலை, வெயிலில் 2 மணி நேர போக்குவரத்து நெரிசலில் சிக்கினால் தக்காளியின் அழுகல் இழப்பு டீசல் சேமிப்பை விட பல மடங்கு அதிகமாகும்.",
    card2Title: "அழுகல் இழப்பு கணிப்பு",
    card2Desc: "தமிழக வானிலை, வாகன குளிர்சாதன வசதி மற்றும் பயிர் வகைக்கு ஏற்ப விரிவான அறிவியல் கணக்கீடு.",
    card3Title: "வெளிப்படையான கணக்கீடு",
    card3Desc: "டீசல், சுங்கக்கட்டணம், ஓட்டுநர் கூலி, வாகன தேய்மானம் மற்றும் அழுகல் இழப்பு ஆகியவற்றின் தெளிவான ரூபாய் விவரம்.",

    // Form
    plannerTitle: "விளைபொருள் விவரங்கள்",
    cropLabel: "விளைபொருள் வகை",
    quantityLabel: "அளவு (கிலோவில்)",
    originLabel: "பண்ணை உள்ள இடம்",
    originPlaceholder: "கிராமத்தைத் தேடவும் அல்லது வரைபடத்தில் கிளிக் செய்யவும்",
    destinationLabel: "செல்ல வேண்டிய சந்தை",
    vehicleLabel: "சரக்கு வாகன வகை",
    departureTimeLabel: "புறப்படும் நேரம்",
    maxHoursLabel: "அதிகபட்ச பயண நேரம் (மணி)",
    priceOverrideLabel: "சந்தை மொத்த விலை (₹/கிலோ)",
    fuelOverrideLabel: "டீசல் விலை (₹/லிட்டர்)",
    optimizeBtn: "உகந்த பாதையை கணக்கிடு",
    optimizingBtn: "பாதைகள் மற்றும் அழுகல் கணக்கிடப்படுகிறது...",

    // Validation
    errQuantityZero: "அளவு 0 கிலோவை விட அதிகமாக இருக்க வேண்டும்.",
    errExceedCapacity: "வாகனத்தின் கொள்ளளவை விட அதிக சுமை. பெரிய லாரியைத் தேர்ந்தெடுக்கவும்.",
    errMissingOrigin: "பண்ணை உள்ள இடத்தை குறிப்பிடவும்.",
    errMissingDest: "சந்தையை தேர்ந்தெடுக்கவும்.",

    // Results
    resultsTitle: "பாதை ஒப்பீடு மற்றும் பரிந்துரை",
    recommendedBadge: "சிறந்த பரிந்துரை",
    estimatedBadge: "மதிப்பீடு",
    routeComparison: "பாதை ஒப்பீட்டு அட்டவணை",
    colRoute: "பாதை",
    colDistance: "தூரம்",
    colTime: "பயண நேரம்",
    colTransportCost: "போக்குவரத்து செலவு",
    colSpoilage: "அழுகல் அளவு",
    colExpectedLoss: "அழுகல் இழப்பு",
    colTotalLoss: "மொத்த இழப்பு/செலவு",
    colScore: "மதிப்பெண்",
    whyThisRoute: "ஏன் இந்தப் பாதை? (காரண விவரம்)",
    assumptionsNotice: "அனுமானங்கள் மற்றும் வெளிப்படைத்தன்மை",
    assumptionsSub: "மாதிரி செயல்முறை அனுமானம்: அழுகல் விகிதங்கள் மற்றும் போக்குவரத்து தாமதங்கள் ஆய்வு விளக்கத்திற்காக அமைக்கப்பட்டவை.",

    // Tabs
    tabPlanner: "பாதை திட்டமிடல்",
    tabVrp: "பல லாரிகள் (VRP)",
    tabHistory: "முந்தைய பதிவுகள்",
    tabAdmin: "விலை & அளவுருக்கள்",

    // VRP
    vrpTitle: "பல பண்ணைகள் மற்றும் லாரிகள் ஒதுக்கீடு",
    vrpDesc: "பல்வேறு பண்ணைகளிலிருந்து அறுவடையை ஒருங்கிணைத்து பல லாரிகளுக்கு பிரித்து வழங்கும் வசதி.",
    solveVrpBtn: "லாரி ஒதுக்கீட்டை கணக்கிடு",

    // History
    historyTitle: "கடந்த கால ஏற்றுமதி பதிவுகள்",
    exportCsv: "CSV பதிவிறக்கம்",
    noHistory: "பதிவுகள் இல்லை. புதிய பாதையைத் திட்டமிடுங்கள்.",
  }
};
