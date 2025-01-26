import {corpus} from '@/lib/corpus';
import evaluation from '@/data/evaluation/report.json';
import Workspace from './workspace';
export default function Home(){return <Workspace corpus={corpus} evaluation={evaluation}/>;}
