import { state as appState } from "../../../core/state.js";
import { isMobileLayout } from "../../../core/viewport.js";
import { changeCalendarMonth } from "../../../features/calendar.js";
import {
  deleteFamilyEvent,
  editFamilyEvent,
} from "../../../features/events.js";
import { fit, focusPerson } from "../../../graph/camera.js";
import { select } from "../../../ui/render.js";
import { renderCalendar } from "../../../ui/workspaces/calendar.js";
import { renderEvents } from "../../../ui/workspaces/events.js";

export const calendarClicks = [
  {
    priority: 18,
    matches: (b) => b.dataset.calendarOpenMonth,
    run: async (b) => {
      changeCalendarMonth(b.dataset.calendarOpenMonth);
    },
  },
  {
    priority: 19,
    matches: (b) => b.dataset.calendarMode,
    run: async (b) => {
      appState.calendarMode = b.dataset.calendarMode;
      renderCalendar();
    },
  },
  {
    priority: 20,
    matches: (b) => b.dataset.calendarDay,
    run: async (b) => {
      appState.calendarDay = b.dataset.calendarDay;
      renderCalendar();
    },
  },
  {
    priority: 36,
    matches: (b) => b.dataset.eventMode,
    run: async (b) => {
      appState.eventMode = b.dataset.eventMode;
      appState.eventLimit = 80;
      renderEvents();
    },
  },
  {
    priority: 37,
    matches: (b) => b.dataset.editEvent,
    run: async (b) => {
      await editFamilyEvent(b.dataset.eventOwner, b.dataset.editEvent);
    },
  },
  {
    priority: 38,
    matches: (b) => b.dataset.deleteEvent,
    run: async (b) => {
      await deleteFamilyEvent(b.dataset.eventOwner, b.dataset.deleteEvent);
    },
  },
  {
    priority: 39,
    matches: (b) => b.dataset.eventPerson,
    run: async (b) => {
      select("person", b.dataset.eventPerson);
      isMobileLayout() ? focusPerson() : fit();
    },
  },
];
