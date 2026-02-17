function a(t){if(!t)return"";const i=new Date(t),n=String(i.getDate()).padStart(2,"0"),s=String(i.getMonth()+1).padStart(2,"0"),l=i.getFullYear();return`${n}.${s}.${l}`}async function r(t){const i={draft:"Черновик",issued:"Выдан",revoked:"Отозван"},n=`
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
                th, td { border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .student-name, .organization { text-align: left; }
                .footer { margin-top: 15px; font-size: 8pt; }
                .legend { margin-bottom: 10px; }
                .signature-block { margin-top: 10px; display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ВЕДОМОСТЬ ВЫДАЧИ СЕРТИФИКАТОВ</h1>
            </div>
            
            <div class="info">
                <div class="info-col">
                    <div class="info-row"><span class="info-label">Учебная программа:</span> ${t.courseName}</div>
                    <div class="info-row"><span class="info-label">Группа:</span> ${t.groupCode}</div>
                </div>
                <div class="info-col">
                    <div class="info-row"><span class="info-label">Инструкторы:</span> ${t.instructors.length>0?t.instructors.join(", "):"Не указаны"}</div>
                    ${t.startDate&&t.endDate?`<div class="info-row"><span class="info-label">Период:</span> ${a(t.startDate)} — ${a(t.endDate)}</div>`:""}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 25px;">№</th>
                        <th style="width: 120px;">ФИО слушателя</th>
                        <th style="width: 100px;">Организация</th>
                        <th style="width: 45px;">Посещ. %</th>
                        <th style="width: 45px;">Ср. балл</th>
                        <th style="width: 50px;">Дисц. пройдено</th>
                        <th style="width: 60px;">Допуск</th>
                        <th style="width: 60px;">Статус сертификата</th>
                        <th style="width: 60px;">Дата выдачи</th>
                        <th style="width: 70px;">№ сертификата</th>
                    </tr>
                </thead>
                <tbody>
                    ${t.students.map((e,d)=>`
                        <tr>
                            <td>${d+1}</td>
                            <td class="student-name">${e.fullName}</td>
                            <td class="organization">${e.organization||"—"}</td>
                            <td>${e.totalAttendancePercent.toFixed(0)}%</td>
                            <td>${e.averageGrade!==null?e.averageGrade.toFixed(1):"—"}</td>
                            <td>${e.eligibility.completedDisciplines}/${e.eligibility.totalDisciplines}</td>
                            <td>${e.eligibility.isEligible?"Допущен":"Не допущен"}</td>
                            <td>${e.certificate?i[e.certificate.status]:"Не выдан"}</td>
                            <td>${e.certificate?.issueDate?a(e.certificate.issueDate):"—"}</td>
                            <td>${e.certificate?.certificateNumber||"—"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            
            <div class="footer">
                <div class="legend">
                    * Статусы: Выдан — сертификат выдан студенту, Отозван — сертификат аннулирован, Не выдан — сертификат не был выдан.
                </div>
                <div class="signature-block">
                    <div>Ведомость сформирована: ${t.generatedBy}</div>
                    <div>Дата: ${a(new Date().toISOString())}</div>
                </div>
            </div>
        </body>
        </html>
    `,s=new Blob([n],{type:"text/html"}),l=URL.createObjectURL(s),o=document.createElement("a");o.href=l,o.download=`Vedomost_Certificates_${t.groupCode}.doc`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(l)}export{r as generateCertificateReportDocx};
