document.addEventListener('alpine:init', () => {
    Alpine.store('habitData', {
        monthlyRows: {},
        load() {
            let data = JSON.parse(localStorage.getItem('habitData')) || {};
            this.monthlyRows = data.monthlyRows || {};
        },
        save() {
            localStorage.setItem('habitData', JSON.stringify({
                monthlyRows: this.monthlyRows
            }));
        },
        getRowsForMonth(year, month) {
            const key = `${year}-${month}`;
            return this.monthlyRows[key] || [];
        },
        setRowsForMonth(year, month, rows) {
            const key = `${year}-${month}`;
            this.monthlyRows[key] = rows;
            this.save();
        },
    });

    Alpine.data('habitTracker', () => ({
        nextId: 1,
        daysInMonth: [],
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        draggedRow: null,
        initAlpine() {
            this.calculateDaysInMonth();
            Alpine.store('habitData').load();
            if (!Alpine.store('habitData').getRowsForMonth(this.currentYear, this.currentMonth).length) {
                this.initializeDefaultData();
            }
        },
        initializeDefaultData() {
            this.addRow(true, 'Good Habits');
            this.addRow(false, 'Read', 'Good Habits');
            this.addRow(false, 'Workout', 'Good Habits');
            this.addRow(true, 'Bad Habits');
            this.addRow(false, 'Eating Junk', 'Bad Habits');
            this.addRow(true, 'Mood');
        },
        calculateDaysInMonth() {
            this.daysInMonth = Array.from({ length: new Date(this.currentYear, this.currentMonth + 1, 0).getDate() }, (_, i) => i + 1);
        },
        isWeekend(day) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dayOfWeek = date.getDay();
            return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        },
        addRow(isCategory = false, name = '', category = null) {
            const rows = this.getCurrentMonthRows();
            const newRow = { 
                id: this.nextId++, 
                name, 
                checkedDays: [], 
                isCategory, 
                category, 
                emoji: isCategory && name === 'Mood' ? Object.fromEntries(this.daysInMonth.map(day => [day, ''])) : null 
            };
            rows.push(newRow);
            this.saveCurrentMonthRows(rows);
        },
        toggleHabit(row, day) {
            if (row.checkedDays.includes(day)) {
                row.checkedDays = row.checkedDays.filter(d => d !== day);
            } else {
                row.checkedDays.push(day);
            }
            this.saveCurrentMonthRows(this.getCurrentMonthRows());
        },
        isHabitChecked(row, day) {
            return row.checkedDays.includes(day);
        },
        removeRow(id) {
            const rows = this.getCurrentMonthRows().filter(row => row.id !== id);
            this.saveCurrentMonthRows(rows);
        },
        prevMonth() {
            if (this.currentMonth === 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
            this.calculateDaysInMonth();
        },
        nextMonth() {
            if (this.currentMonth === 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
            this.calculateDaysInMonth();
        },
        getMonthName() {
            return new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' });
        },
        getCurrentMonthRows() {
            return Alpine.store('habitData').getRowsForMonth(this.currentYear, this.currentMonth);
        },
        saveCurrentMonthRows(rows) {
            Alpine.store('habitData').setRowsForMonth(this.currentYear, this.currentMonth, rows);
        },
        dragStart(row) {
            this.draggedRow = row;
        },
        dragOver(event) {
            event.preventDefault();
        },
        drop(targetRow) {
            const rows = this.getCurrentMonthRows();
            const draggedRowIndex = rows.findIndex(row => row.id === this.draggedRow.id);
            const targetRowIndex = rows.findIndex(row => row.id === targetRow.id);
            rows.splice(targetRowIndex, 0, rows.splice(draggedRowIndex, 1)[0]);
            this.saveCurrentMonthRows(rows);
            this.draggedRow = null;
        },
        saveState() {
            Alpine.store('habitData').save();
        },

        // This exports the data 
        exportData() {
            const data = {
                currentYear: this.currentYear,
                currentMonth: this.currentMonth,
                rows: this.getCurrentMonthRows()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `habit_data_${this.currentYear}_${this.currentMonth + 1}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        // Import data
        importData(event) {
            const file = event.target.files[0];

            if (!file) {
                alert('No file selected for import.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    this.currentYear = importedData.currentYear;
                    this.currentMonth = importedData.currentMonth;
                    this.saveCurrentMonthRows(importedData.rows);
                    alert('Your habits have been imported successfully!');
                } catch (error) {
                    alert('Error importing habits. Verify that it is a HabitTracker® approved JSON file.');
                }
            };

            reader.readAsText(file);
        },
    }));
});
