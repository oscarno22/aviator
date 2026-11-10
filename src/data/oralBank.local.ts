import type { OralQuestion } from "./oralBank";

/**
 * Charlotte-area questions (KJQF, KEQY, the Charlotte Class B).
 * Every local fact here comes from src/data/airports.ts. If that file changes, update these.
 * Class B shelf floors are deliberately not quoted: the answer is always "check the Charlotte TAC".
 */
export const ORAL_BANK_LOCAL: OralQuestion[] = [
  {
    id: "airspace-local-kjqf-airspace",
    areaId: "airspace",
    q: "What airspace is Concord, KJQF, in, and does that change during the day?",
    answer:
      "When the tower is open, 0700 to 2300 local, Concord is Class D from the surface to 2,500 feet AGL, and it sits under the Charlotte Class B shelves. When the tower is closed the Class D goes away and the airspace reverts to Class E or G.",
    keyPoints: ["Class D when the tower is open", "Tower hours 0700 to 2300 local", "Surface to 2,500 ft AGL", "Under the Charlotte Class B shelves", "Class E/G when the tower is closed"],
    ref: "Chart Supplement (KJQF); Charlotte TAC; 14 CFR 91.129",
    local: true,
  },
  {
    id: "airspace-local-bravo-clearance",
    areaId: "airspace",
    q: "You call Charlotte Approach near the practice area. They give you a squawk code and say \"radar contact.\" Can you climb into the Class Bravo?",
    answer:
      "No. A squawk code and \"radar contact\" are not a clearance. I need to hear the words \"cleared into the Class Bravo airspace\". Until then I stay below the shelf, and I check the Charlotte TAC for the shelf floor over where I am.",
    keyPoints: ["A squawk and radar contact are not a clearance", "Need \"cleared into the Class Bravo airspace\"", "Stay below the shelf until cleared", "Shelf floors come from the Charlotte TAC"],
    ref: "14 CFR 91.131(a)(1); AIM 3-2-3; Charlotte TAC",
    scenario: true,
    local: true,
  },
  {
    id: "airspace-local-mode-c-veil",
    areaId: "airspace",
    q: "What is the Mode C veil around Charlotte, and what does it require?",
    answer:
      "It is the airspace within 30 nautical miles of Charlotte Douglas, from the surface up to 10,000 feet MSL. Inside it the airplane needs a transponder with altitude reporting and ADS-B Out, even when it stays outside the Class B itself.",
    keyPoints: ["Within 30 NM of CLT", "Surface to 10,000 ft MSL", "Transponder with altitude reporting", "ADS-B Out", "Applies even outside the Class B"],
    ref: "14 CFR 91.215(b)(2), 91.225(d)(2); Charlotte TAC",
    local: true,
  },
  {
    id: "airspace-local-bravo-shelf-and-speed",
    areaId: "airspace",
    q: "You are leaving Concord for the practice area and want to climb. What do you have to think about with the Charlotte Class B above you?",
    answer:
      "Concord sits under the Class B shelves, so before I climb I check the Charlotte TAC for the shelf floor over the practice area and stay below it unless I have a Bravo clearance. The Class B ceiling is 10,000 feet MSL. The speed limit under the shelves is 200 knots, which a 172 will not reach.",
    keyPoints: ["KJQF is under the Class B shelves", "Check the Charlotte TAC for the shelf floor", "Stay below the floor unless cleared into the Bravo", "200 knots under the shelves"],
    ref: "Charlotte TAC; 14 CFR 91.131, 91.117(c)",
    scenario: true,
    local: true,
  },
  {
    id: "airport-local-kjqf-frequencies",
    areaId: "airport",
    q: "You are parked at Concord and ready to go. Who do you talk to, in what order, and on what frequencies?",
    answer:
      "ATIS first on 133.675, then Concord Ground on 121.85 for taxi, then Concord Tower on 134.65 when I am ready at the runway. I always confirm the frequencies against the current Chart Supplement.",
    keyPoints: ["ATIS 133.675", "Ground 121.85", "Tower 134.65", "Verify against the current Chart Supplement"],
    ref: "Chart Supplement (KJQF)",
    local: true,
  },
  {
    id: "airport-local-kjqf-pattern",
    areaId: "airport",
    q: "Describe the runway and the traffic pattern at Concord.",
    answer:
      "One runway, 02/20, 7,402 feet long and 100 feet wide. Field elevation is 704 feet, pattern altitude is 1,700 feet MSL, about 1,000 feet above the ground, and it is left traffic for both runways unless the tower says otherwise. It is busy with training and corporate jet traffic, so I expect sequencing and \"line up and wait\".",
    keyPoints: ["Runway 02/20, 7,402 by 100 ft", "Pattern altitude 1,700 ft MSL", "Left traffic both runways", "Busy mix of traffic: expect sequencing"],
    ref: "Chart Supplement (KJQF)",
    local: true,
  },
  {
    id: "airport-local-kjqf-tower-closed",
    areaId: "airport",
    q: "You return to Concord after 2300 local and the tower is closed. How do you operate?",
    answer:
      "Like a non-towered airport. I self-announce on the CTAF, which is the tower frequency, 134.65, and fly the standard left pattern at 1,700 feet MSL. Charlotte Approach handles the area when the tower is closed; the north side sector on the Concord side is 128.325.",
    keyPoints: ["Tower closes at 2300 local", "Self-announce on CTAF 134.65", "Left traffic at 1,700 ft MSL", "Charlotte Approach 128.325 on the Concord side"],
    ref: "Chart Supplement (KJQF); AIM 4-1-9",
    scenario: true,
    local: true,
  },
  {
    id: "airport-local-keqy-operations",
    areaId: "airport",
    q: "You are flying to Monroe, KEQY, for landing practice. Brief me on the airport.",
    answer:
      "Monroe is non-towered, in a Class E surface area under the Charlotte Class B. I get the weather from the AWOS on 135.775 and self-announce on CTAF 122.7. The runway is 05/23, 7,001 by 100 feet, left traffic both ways, pattern altitude about 1,700 feet MSL. Hazards are deer and birds, and a steep shoulder drop-off between runway 23 and taxiway Alpha.",
    keyPoints: ["Non-towered: CTAF 122.7", "AWOS 135.775", "Runway 05/23, left traffic, pattern about 1,700 ft MSL", "Deer and birds", "Steep drop-off between runway 23 and taxiway Alpha"],
    ref: "Chart Supplement (KEQY)",
    local: true,
  },
  {
    id: "xc-local-charlotte-approach-sectors",
    areaId: "xc",
    q: "You want flight following in the Charlotte area. Which Charlotte Approach frequency would you try from the Concord side, and which from the Monroe side?",
    answer:
      "128.325 on the north side near Concord, and 120.05 on the south and east side near Monroe. Flight following is not a Class B clearance, so I still stay out of the Bravo until I hear the clearance.",
    keyPoints: ["128.325: north, Concord side", "120.05: south and east, Monroe side", "Flight following is not a Class B clearance"],
    ref: "Chart Supplement (KJQF, KEQY); Charlotte TAC",
    local: true,
  },
];
