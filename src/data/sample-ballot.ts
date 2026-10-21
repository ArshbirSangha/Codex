import type { Ballot } from "../lib/ballot";

/** All places, candidates, biographies, and positions below are fictional. */
export const sampleBallot: Ballot = {
  id: "riverbend-2026",
  title: "Riverbend City General Election",
  location: "Riverbend City",
  electionDate: "2026-11-03",
  description:
    "A fictional ballot for exploring how your priorities compare with candidates. All candidates, biographies, and positions are made up for this demo.",
  isDemo: true,
  contests: [
    {
      id: "mayor",
      title: "Mayor",
      description: "Leads city government and proposes the city budget.",
      seats: 1,
      candidates: [
        {
          id: "maya-chen",
          name: "Maya Chen",
          party: "Nonpartisan",
          initials: "MC",
          color: "#55735b",
          bio: "Fictional candidate. A community planner focused on housing, public transit, and long-term infrastructure.",
          positions: {
            housing: 2,
            transportation: 2,
            "public-safety": 1,
            "city-budget": 1,
            "climate-resilience": 2,
          },
          sources: [],
        },
        {
          id: "james-okafor",
          name: "James Okafor",
          party: "Nonpartisan",
          initials: "JO",
          color: "#a16d4b",
          bio: "Fictional candidate. A small-business owner focused on reliable city services, road maintenance, and keeping taxes steady.",
          positions: {
            housing: -1,
            transportation: -2,
            "public-safety": -1,
            "city-budget": -2,
            "climate-resilience": 0,
          },
          sources: [],
        },
        {
          id: "sofia-rivera",
          name: "Sofia Rivera",
          party: "Nonpartisan",
          initials: "SR",
          color: "#85709c",
          bio: "Fictional candidate. A neighborhood organizer focused on gradual housing growth, crisis response, and practical city improvements.",
          positions: {
            housing: 1,
            transportation: 0,
            "public-safety": 2,
            "city-budget": 0,
            "climate-resilience": 1,
          },
          sources: [],
        },
      ],
    },
    {
      id: "city-council",
      title: "City Council",
      description:
        "Sets local policy, adopts the budget, and represents city residents. Two seats are open.",
      seats: 2,
      candidates: [
        {
          id: "priya-patel",
          name: "Priya Patel",
          party: "Nonpartisan",
          initials: "PP",
          color: "#9b7850",
          bio: "Fictional candidate. A civil engineer interested in housing near transit and preparing public infrastructure for extreme weather.",
          positions: {
            housing: 2,
            transportation: 1,
            "public-safety": 0,
            "city-budget": 1,
            "climate-resilience": 2,
          },
          sources: [],
        },
        {
          id: "alex-morgan",
          name: "Alex Morgan",
          party: "Nonpartisan",
          initials: "AM",
          color: "#647e91",
          bio: "Fictional candidate. A local shop owner focused on street maintenance, predictable taxes, and neighborhood services.",
          positions: {
            housing: 0,
            transportation: -1,
            "public-safety": -1,
            "city-budget": -2,
            "climate-resilience": -1,
          },
          sources: [],
        },
        {
          id: "elena-torres",
          name: "Elena Torres",
          party: "Nonpartisan",
          initials: "ET",
          color: "#927282",
          bio: "Fictional candidate. A social worker focused on civilian crisis response, accessible transportation, and public services.",
          positions: {
            housing: 1,
            transportation: 2,
            "public-safety": 2,
            "city-budget": 2,
            "climate-resilience": 1,
          },
          sources: [],
        },
        {
          id: "daniel-brooks",
          name: "Daniel Brooks",
          party: "Nonpartisan",
          initials: "DB",
          color: "#748064",
          bio: "Fictional candidate. A longtime neighborhood volunteer focused on existing neighborhoods, public safety, and gradual capital improvements.",
          positions: {
            housing: -2,
            transportation: -1,
            "public-safety": -2,
            "city-budget": -1,
            "climate-resilience": null,
          },
          sources: [],
        },
      ],
    },
    {
      id: "school-board",
      title: "School Board",
      description:
        "Oversees the school district budget, learning policies, and student services.",
      seats: 1,
      candidates: [
        {
          id: "aisha-robinson",
          name: "Aisha Robinson",
          party: "Nonpartisan",
          initials: "AR",
          color: "#8b7756",
          bio: "Fictional candidate. A former teacher focused on smaller classes and expanding support available to students at school.",
          positions: {
            "learning-priorities": 0,
            "school-budget": 2,
            "student-support": 2,
          },
          sources: [],
        },
        {
          id: "noah-kim",
          name: "Noah Kim",
          party: "Nonpartisan",
          initials: "NK",
          color: "#68828b",
          bio: "Fictional candidate. A parent volunteer focused on a consistent curriculum, academic programs, and maintaining school facilities.",
          positions: {
            "learning-priorities": -2,
            "school-budget": -1,
            "student-support": -1,
          },
          sources: [],
        },
        {
          id: "grace-williams",
          name: "Grace Williams",
          party: "Nonpartisan",
          initials: "GW",
          color: "#8a7797",
          bio: "Fictional candidate. An after-school program director focused on school-level flexibility and a balance of classroom and student support investments.",
          positions: {
            "learning-priorities": 2,
            "school-budget": 0,
            "student-support": 1,
          },
          sources: [],
        },
      ],
    },
  ],
  questions: [
    {
      id: "housing",
      topic: "Housing",
      title: "The city should allow more apartments near transit.",
      description:
        "More apartments could increase the housing supply and change neighborhood density. Keeping current rules would limit that change.",
      lowLabel: "Keep current density rules",
      highLabel: "Allow more apartments",
      contestIds: ["mayor", "city-council"],
    },
    {
      id: "transportation",
      topic: "Transportation",
      title:
        "The city should prioritize public transit and bike routes in its transportation budget.",
      description:
        "The transportation budget can fund bus service and bike routes, road improvements and parking, or a mix of both.",
      lowLabel: "Prioritize roads and parking",
      highLabel: "Prioritize transit and biking",
      contestIds: ["mayor", "city-council"],
    },
    {
      id: "public-safety",
      topic: "Public safety",
      title:
        "The city should expand civilian teams for nonviolent crisis calls.",
      description:
        "Civilian teams can respond to certain mental health and welfare calls. The alternative puts more resources toward police-led response.",
      lowLabel: "Prioritize police-led response",
      highLabel: "Expand civilian crisis teams",
      contestIds: ["mayor", "city-council"],
    },
    {
      id: "city-budget",
      topic: "City budget",
      title:
        "The city should raise local taxes to fund expanded public services.",
      description:
        "Additional revenue could expand services such as libraries, parks, and street maintenance. Keeping tax levels steady would limit new spending.",
      lowLabel: "Maintain current tax levels",
      highLabel: "Raise taxes for more services",
      contestIds: ["mayor", "city-council"],
    },
    {
      id: "climate-resilience",
      topic: "Climate resilience",
      title: "The city should speed up flood and heat resilience projects.",
      description:
        "Accelerating drainage, shade, and cooling projects would require more spending now. A gradual schedule would spread those costs over time.",
      lowLabel: "Phase projects in gradually",
      highLabel: "Accelerate investment now",
      contestIds: ["mayor", "city-council"],
    },
    {
      id: "learning-priorities",
      topic: "Learning priorities",
      title:
        "Schools should have more flexibility to adapt the district curriculum.",
      description:
        "School-level flexibility can tailor lessons to local needs. A shared district curriculum can make learning more consistent across schools.",
      lowLabel: "Keep a shared curriculum",
      highLabel: "Allow more school flexibility",
      contestIds: ["school-board"],
    },
    {
      id: "school-budget",
      topic: "School budget",
      title:
        "The district should prioritize smaller classes over other new spending.",
      description:
        "Smaller classes require more teachers and classroom space. Other uses of new funding include academic programs, technology, and building improvements.",
      lowLabel: "Prioritize other investments",
      highLabel: "Prioritize smaller classes",
      contestIds: ["school-board"],
    },
    {
      id: "student-support",
      topic: "Student support",
      title: "The district should expand on-campus mental health services.",
      description:
        "More counselors and on-campus services would direct new funds toward student support. Those funds could also expand academic instruction and tutoring.",
      lowLabel: "Focus new funds on academics",
      highLabel: "Expand mental health services",
      contestIds: ["school-board"],
    },
  ],
};
