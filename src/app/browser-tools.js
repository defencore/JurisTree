import { state as appState } from "../core/state.js";
import { clone, uid } from "../core/utils.js";
import { fit } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { gaps, route, sourceInScope } from "../model/evidence.js";
import { kinshipBetween } from "../model/kinship.js";
import { person } from "../model/lookup.js";
import { profileScope } from "../model/profile-scope.js";
import { scopedPerson } from "../model/project.js";
import { commit } from "../services/history.js";

export function webTools() {
  if (!document.modelContext?.registerTool) return;
  const lc = new AbortController();
  for (const tool of [
    {
      name: "read_family_tree",
      title: translate("ui.readFamilyTree"),
      description:
        "Read the current family tree and metadata, without file bytes.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
      },
      execute: () => ({
        title: appState.project.title,
        purpose: appState.project.purpose,
        visibleSections: profileScope(),
        groups: clone(appState.project.groups),
        people: appState.project.people.map(scopedPerson),
        relations: clone(appState.project.relations),
        documents: appState.project.documents
          .filter(sourceInScope)
          .map((d) => ({
            ...d,
            attachments: d.attachments.map(
              ({ assetId: _assetId, ...file }) => file,
            ),
          })),
      }),
    },
    {
      name: "describe_family_relationship",
      title: translate("ui.howAreWeRelated"),
      description:
        "Describe the recorded family relationship between two people, including cousin degree, generation difference and evidence gaps.",
      inputSchema: {
        type: "object",
        properties: {
          from_id: {
            type: "string",
          },
          to_id: {
            type: "string",
          },
        },
        required: ["from_id", "to_id"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
      },
      execute: ({ from_id, to_id }) => {
        if (!person(from_id) || !person(to_id))
          throw Error(translate("ui.unknownPerson"));
        return kinshipBetween(from_id, to_id);
      },
    },
    {
      name: "read_document_gaps",
      title: translate("ui.readEvidenceGaps"),
      description:
        "Read the advisory document checklist for the selected purpose and inheritance route.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
      },
      execute: () => ({
        purpose: appState.project.purpose,
        gaps: gaps(),
        route: route(),
      }),
    },
    {
      name: "add_family_person",
      title: translate("ui.addPersonToTree"),
      description:
        "Create a named person in the current browser draft. Does not establish legal kinship.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 150,
          },
          birth: {
            type: "string",
            maxLength: 40,
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: true,
      },
      execute: (input) => {
        if (!appState.editorActive)
          throw Error(translate("ui.openOrCreateAMapFirst"));
        if (
          !input ||
          typeof input.name !== "string" ||
          !input.name.trim() ||
          input.name.length > 150 ||
          (input.birth !== undefined && typeof input.birth !== "string")
        )
          throw Error(translate("ui.invalidPersonInformation"));
        const p = {
          id: uid(),
          name: input.name.trim(),
          birth: input.birth || "",
          death: "",
          aliases: "",
          place: "",
          gender: "u",
          notes: "",
          requirements: null,
          avatarId: "",
          x: 40 + appState.project.people.length * 250,
          y: 80,
        };
        commit(() => appState.project.people.push(p));
        fit();
        return {
          id: p.id,
          name: p.name,
        };
      },
    },
  ])
    try {
      Promise.resolve(
        document.modelContext.registerTool(tool, {
          signal: lc.signal,
        }),
      ).catch(() => {});
    } catch {}
  window.addEventListener("pagehide", () => lc.abort(), {
    once: true,
  });
}
