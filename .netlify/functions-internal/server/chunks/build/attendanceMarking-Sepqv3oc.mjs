const MARKING_STATUS_LABELS = {
  pending: "Не отмечено",
  in_progress: "В процессе",
  on_time: "Вовремя",
  late: "С опозданием",
  overdue: "Просрочено",
  approved: "Одобрено"
};
const MARKING_STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  on_time: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  approved: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
};
const REQUEST_STATUS_LABELS = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено"
};
const REQUEST_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
};

export { MARKING_STATUS_COLORS as M, REQUEST_STATUS_COLORS as R, MARKING_STATUS_LABELS as a, REQUEST_STATUS_LABELS as b };
//# sourceMappingURL=attendanceMarking-Sepqv3oc.mjs.map
