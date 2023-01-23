import { generateDatesFromYearBeginning } from "../utils/gerenate-dates-from-year-beginning"
import { HabitDay } from "./HabitDay"
import { useEffect, useState} from "react"
import { api } from "../lib/axios"
import dayjs from "dayjs"

import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)

const weekDays = [
  'D',
  'S',
  'T',
  'Q',
  'Q',
  'S',
  'S',
]

const summaryDates = generateDatesFromYearBeginning()

const minimumSummaryDatesSize = 18 * 7 // 18 weeks
const amountOfDaysToFill = minimumSummaryDatesSize - summaryDates.length

type Summary = Array<{
  id: string;
  date: string;
  amount: number;
  completed: number;
}>

// or
/* 
type Summary = Array{
  id: string;
  date: string;
  amount: number;
  completed: number;
}[]
 */

export function SummaryTable(){

  const [summary, setSummary] = useState<Summary>([])

  // aqui executa toda vez q o react entrar no fluxo de atualização
  // então por enquanto se usa useEffect

  useEffect(() => {
    api.get('summary').then(response => {
      setSummary(response.data)
    })
  }, [])

  return(
    <div className="w-full flex mt-16">

      <div className="grid grid-rows-7 grid-flow-row gap-3">
        {weekDays.map((weekDay, i) => {
          return (
            <div 
              key={`${weekDay}-${i}`} 
              className="text-zinc-400 text-xl h-10 w-10 font-bold flex items-center justify-center">
              {weekDay}
            </div>
          )
        })}
      </div>

      <div className="grid grid-rows-7 grid-flow-col gap-3">
        {summary.length > 0 && summaryDates.map((date, i) => {

          const dayInSummary = summary.find(day => {
            return dayjs(date).isSame(day.date, 'day')
          })

          if(dayInSummary){
          
            // pegar a data atual
            let today = new Date()
            console.log(today);

            // pegar o fuso dela
            let timeZone = today.getTimezoneOffset()
            console.log(timeZone)

            // pega a data do server
            let dateFromServer = dayInSummary.date
            console.log(dateFromServer)

            // converto para o fuso da data atual
            let newDate = dayjs(dateFromServer).tz()
            console.log(newDate)

            // print
            const twoday = dayjs().startOf("day").toDate()
            console.log(twoday)
          }

          return (
            <HabitDay 
              key={date.toString()}
              date={date}
              amount={dayInSummary?.amount}
              defaultCompleted={dayInSummary?.completed}  // Math.round(Math.random() * 5)
            />
          )
        })}

        {amountOfDaysToFill > 0 && Array.from({ length: amountOfDaysToFill }).map((_, i) =>{
          return (
            <div key={i} className="w-10 h-10 bg-zinc-900 border-2 border-zinc-800 rounded-lg opacity-40 cursor-not-allowed"/>
          )
        })}   
      </div>
    </div>
  )
}