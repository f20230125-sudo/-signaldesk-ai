import { corpus } from '@/lib/corpus';
import report from '@/data/evaluation/report.json';
import type { Evaluation } from './ui/evaluation-view';
import Workspace from './workspace';

// Preserve full responses and traces in the frozen artifact. The browser only
// needs the recorded task outcomes and review notes.
const evaluation: Evaluation = {
  status: report.status,
  development_tasks: report.development_tasks,
  held_out_tasks: report.held_out_tasks,
  completed_agent_tasks: report.completed_agent_tasks,
  completed_baseline_tasks: report.completed_baseline_tasks,
  summary: report.summary,
  agent_success_rate: report.agent_success_rate,
  baseline_success_rate: report.baseline_success_rate,
  cases: report.cases.map(item => ({
    task_id: item.task_id, category: item.category, mode: item.mode,
    completed: item.completed, strict_pass: item.score.strict_pass,
    notes: item.semantic_audit.notes,
  })),
};

export default function Home() { return <Workspace corpus={corpus} evaluation={evaluation} />; }
