// Простой скрипт для добавления сотрудника через API
async function addEmployee() {
  try {
    const response = await fetch('http://localhost:3000/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Ravshanbek',
        lastName: 'Atabayev',
        middleName: null,
        position: 'Passenger Handling Services Specialist',
        department: 'Passenger Services',
        email: 'atabayev.r@uzbekistan-airports.uz',
        phone: '+998901234572'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Сотрудник успешно добавлен!');
    console.log('Данные:', data);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    // Если сервер не запущен
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n⚠️ Сервер не запущен. Запустите сервер командой: npm run dev');
      console.log('После запуска сервера выполните этот скрипт снова.');
    }
  }
}

addEmployee();
