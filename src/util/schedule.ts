import type { ClassDay, Schedule, Subject, SubjectSchedule } from "@/api";

export type GroupSubjectsResult = {
  groupedSubjects: Map<`${ClassDay}-${number}`, GroupedSubject[]>;
  tbd: string[];
  hasWeekendClasses: boolean;
  maxSlot: number;
};

type GroupedSubject =
  & Pick<Subject, "code" | "section" | "name">
  & Pick<SubjectSchedule, "type" | "blocks">
  & {
  classrooms: Array<Pick<SubjectSchedule, "group" | "classroom">>;
  conflicts: Set<GroupedSubject>;
  slotType: SlotType;
  backgroundColor: string;
  equals(other: GroupedSubject): boolean;
};

export type SlotType = typeof SlotType[keyof typeof SlotType];

export const SlotType = {
  UNIQUE: "u",
  START: "s",
  MIDDLE: "m",
  END: "e",
} as const;

export function groupSubjects(subjects: Set<Subject>, colors: readonly string[]): GroupSubjectsResult {
  const groupedSubjects = new Map<`${ClassDay}-${number}`, GroupedSubject[]>();
  const subjectIds = new Map<string, number>();
  const tbd: string[] = [];
  let hasWeekendClasses = false;
  let maxSlot = 1;

  const iterator = {
    * [Symbol.iterator]() {
      let lastSubjectId = 0;
      for (const subject of subjects) {
        const key = `${subject.code}-${subject.section}`;
        let id = subjectIds.get(key);
        if (id === undefined) {
          id = lastSubjectId++;
          subjectIds.set(key, id);
        }

        for (const slot of subject.schedule) {
          if (!slot.defined) {
            tbd.push(key);
            continue;
          }

          if (slot.day === "sa" || slot.day === "do") {
            hasWeekendClasses = true;
          }

          const sortedBlocks = [...slot.blocks].sort((a, b) => a - b);
          maxSlot = Math.max(maxSlot, ...sortedBlocks);

          for (let i = 0; i < sortedBlocks.length; i++) {
            yield {
              id,
              subject,
              slot,
              sortedBlocks,
              block: sortedBlocks[i]!,
              i,
            };
          }
        }
      }
    },
  };

  for (const { id, subject, slot, sortedBlocks, block, i } of iterator) {
    const subjectsGroup = groupedSubjects.get(`${slot.day}-${block}`);
    const slotType = sortedBlocks.length === 1 ? SlotType.UNIQUE
      : i === 0 ? SlotType.START
        : i === sortedBlocks.length - 1 ? SlotType.END
          : SlotType.MIDDLE;

    const groupedSubject: GroupedSubject = {
      code: subject.code,
      section: subject.section,
      name: subject.name,
      type: slot.type,
      blocks: sortedBlocks,
      classrooms: [{
        group: slot.group,
        classroom: slot.classroom,
      }],
      conflicts: new Set(),
      slotType,
      backgroundColor: colors[id % colors.length]!,
      equals(other: GroupedSubject) {
        return this.code === other.code && this.blocks.toString() === other.blocks.toString();
      },
    };

    if (!subjectsGroup) {
      groupedSubjects.set(`${slot.day}-${block}`, [groupedSubject]);
      continue;
    }

    let foundEqual = false;
    for (const subjectInGroup of subjectsGroup) {
      if (!subjectInGroup.equals(groupedSubject)) {
        subjectInGroup.conflicts.add(groupedSubject);
        groupedSubject.conflicts.add(subjectInGroup);
        continue;
      }

      const hasClassroomAlready = subjectInGroup.classrooms.some(c =>
        c.group === slot.group && c.classroom === slot.classroom
      );

      if (!hasClassroomAlready) {
        subjectInGroup.classrooms.push({
          group: slot.group,
          classroom: slot.classroom,
        });
      }

      foundEqual = true;
    }

    if (!foundEqual) {
      subjectsGroup.push(groupedSubject);
    }
  }

  return {
    groupedSubjects,
    tbd,
    hasWeekendClasses,
    maxSlot,
  };
}
