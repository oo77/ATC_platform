const c={theory:"т",practice:"пр",assessment:"пз",other:"др"};function r(t){if(!t)return"";const n=new Date(t),d=String(n.getDate()).padStart(2,"0"),i=String(n.getMonth()+1).padStart(2,"0"),o=n.getFullYear();return`${d}.${i}.${o}`}function p(t){const n=new Date(t),d=String(n.getDate()).padStart(2,"0"),i=String(n.getMonth()+1).padStart(2,"0");return`${d}.${i}`}async function h(t){const n=`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 11pt; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { font-size: 14pt; font-weight: bold; margin: 10px 0; }
                .info { margin-bottom: 15px; display: flex; justify-content: space-between; }
                .info-col { flex: 1; }
                .info-row { margin: 5px 0; }
                .info-label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
                th, td { border: 1px solid black; padding: 3px; text-align: center; vertical-align: middle; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .student-name { text-align: left; }
                .footer { margin-top: 15px; font-size: 8pt; }
                .legend { margin-bottom: 10px; }
                .signature-block { margin-top: 10px; display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ЗАЧЕТНАЯ ВЕДОМОСТЬ</h1>
            </div>
            
            <div class="info">
                <div class="info-col">
                    ${t.courseName?`<div class="info-row"><span class="info-label">Учебная программа:</span> ${t.courseName}</div>`:""}
                    <div class="info-row"><span class="info-label">Дисциплина:</span> ${t.disciplineName}</div>
                    <div class="info-row"><span class="info-label">Группа:</span> ${t.groupCode}</div>
                </div>
                <div class="info-col">
                    <div class="info-row"><span class="info-label">Инструктор:</span> ${t.instructorName||"Не указан"}</div>
                    ${t.startDate&&t.endDate?`<div class="info-row"><span class="info-label">Период:</span> ${r(t.startDate)} — ${r(t.endDate)}</div>`:""}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 25px;">№</th>
                        <th style="width: 150px;">ФИО слушателя</th>
                        ${t.columns.map(e=>{const l=p(e.scheduleEvent.date),a=e.scheduleEvent.isRetake?"пер":c[e.scheduleEvent.eventType]||"";return`<th style="width: 35px;">${l} ${a}</th>`}).join("")}
                        <th style="width: 50px;">Посещ. %</th>
                        <th style="width: 50px;">Ср. балл</th>
                        <th style="width: 50px;"><strong>Итог</strong></th>
                    </tr>
                </thead>
                <tbody>
                    ${t.rows.map((e,l)=>`
                        <tr>
                            <td>${l+1}</td>
                            <td class="student-name">${e.student.fullName}</td>
                            ${e.cells.map(a=>{if(a.isHidden)return"<td>-</td>";let s="";return a.attendance&&(s=`${a.attendance.hoursAttended}`),a.grade&&(s&&(s+="/"),s+=`${a.grade.grade}`),`<td>${s||""}</td>`}).join("")}
                            <td>${e.attendancePercent.toFixed(0)}</td>
                            <td>${e.averageGrade?e.averageGrade.toFixed(1):"-"}</td>
                            <td>${e.finalGrade?.finalGrade?e.finalGrade.finalGrade.toString():"-"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            
            <div class="footer">
                <div class="legend">
                    * Обозначения: т - теория, пр - практика, пз - проверка знаний, пер - пересдача. В ячейках: Часы / Оценка.
                </div>
                <div class="signature-block">
                    <div>Инструктор: ${t.instructorName||""} _____________________</div>
                    <div>Дата: ${r(new Date().toISOString())}</div>
                </div>
            </div>
        </body>
        </html>
    `,d=new Blob([n],{type:"text/html"}),i=URL.createObjectURL(d),o=document.createElement("a");o.href=i,o.download=`Vedomost_${t.groupCode}.doc`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i)}export{h as generateGroupReportDocx};
