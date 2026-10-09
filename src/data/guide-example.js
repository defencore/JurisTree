import { groupColors } from "../core/config.js";
import { translate } from "../i18n/index.js";
import { fresh } from "../model/project.js";

/** One fictional example supplies the instructions, diagram and downloadable project. */
export const guidePeople = [
  {
    id: "guide-alex",
    name: "Alex Doe",
    gender: "m",
    birth: "1960",
    x: 300,
    y: 0,
  },
  {
    id: "guide-morgan",
    name: "Morgan Doe",
    gender: "f",
    birth: "1962",
    maiden: "Roe",
    x: 600,
    y: 0,
  },
  {
    id: "guide-jamie",
    name: "Jamie Doe",
    gender: "m",
    birth: "1985",
    x: 0,
    y: 300,
  },
  {
    id: "guide-casey",
    name: "Casey Doe",
    gender: "f",
    birth: "1987",
    maiden: "Hart",
    x: 300,
    y: 300,
  },
  {
    id: "guide-taylor",
    name: "Taylor Lane",
    gender: "f",
    birth: "1988",
    maiden: "Doe",
    x: 650,
    y: 300,
  },
  {
    id: "guide-jordan",
    name: "Jordan Lane",
    gender: "m",
    birth: "1986",
    x: 950,
    y: 300,
  },
  {
    id: "guide-robin",
    name: "Robin Doe",
    gender: "m",
    birth: "2010",
    x: 150,
    y: 600,
  },
  {
    id: "guide-avery",
    name: "Avery Lane",
    gender: "f",
    birth: "2012",
    x: 800,
    y: 600,
  },
];
export const guideMarriages = [
  ["guide-alex", "guide-morgan"],
  ["guide-jamie", "guide-casey"],
  ["guide-taylor", "guide-jordan"],
];
export const guideParents = [
  ["guide-alex", "guide-jamie"],
  ["guide-morgan", "guide-jamie"],
  ["guide-alex", "guide-taylor"],
  ["guide-morgan", "guide-taylor"],
  ["guide-jamie", "guide-robin"],
  ["guide-casey", "guide-robin"],
  ["guide-taylor", "guide-avery"],
  ["guide-jordan", "guide-avery"],
];
export const guideGroups = [
  {
    id: "guide-founders",
    name: "Alex & Morgan Doe",
    members: ["guide-alex", "guide-morgan", "guide-jamie", "guide-taylor"],
  },
  {
    id: "guide-doe",
    name: "Jamie & Casey Doe",
    members: ["guide-jamie", "guide-casey", "guide-robin"],
  },
  {
    id: "guide-lane",
    name: "Taylor & Jordan Lane",
    members: ["guide-taylor", "guide-jordan", "guide-avery"],
  },
];
export function guidePersonName(id) {
  return guidePeople.find((person) => person.id === id).name;
}
export function guideExampleProject() {
  return {
    ...fresh(),
    title: translate("ui.guideExampleProjectTitle"),
    demo: true,
    people: guidePeople.map(({ maiden, ...person }) => ({
      ...person,
      death: "",
      lifeStatus: "living",
      groupIds: guideGroups
        .filter((group) => group.members.includes(person.id))
        .map((group) => group.id),
      nameHistory: maiden
        ? [
            {
              id: `maiden-${person.id}`,
              kind: "maiden",
              fullName: `${person.name.split(" ")[0]} ${maiden}`,
              surname: maiden,
              from: person.birth,
            },
          ]
        : [],
    })),
    relations: [
      ...guideMarriages.map(([from, to], i) => ({
        id: `guide-marriage-${i}`,
        from,
        to,
        type: "spouse",
        unionKind: "marriage",
      })),
      ...guideParents.map(([from, to], i) => ({
        id: `guide-parent-${i}`,
        from,
        to,
        type: "parent",
      })),
    ],
    groups: guideGroups.map(({ id, name }, i) => ({
      id,
      name,
      color: groupColors[i],
      notes: "",
      collapsed: false,
      x: null,
      y: null,
    })),
  };
}
