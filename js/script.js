const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const addBtn = document.getElementById('add-btn');

let todos = JSON.parse(localStorage.getItem('todos')) || [];

let autoSelectIdx = null;
let autoSelectCompleted = false;

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = '';
  const completedList = document.getElementById('completed-list');
  completedList.innerHTML = '';

  let hasCompleted = false;

  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.onchange = () => {
      todo.completed = checkbox.checked;
      saveTodos();
      renderTodos();
    };
    li.appendChild(checkbox);

    // Task text
    const span = document.createElement('span');
    span.className = 'todo-text' + (todo.completed ? ' completed' : '');
    span.textContent = todo.text;
    span.contentEditable = todo.editing ? 'true' : 'false';

    span.onblur = () => {
      if (todo.editing) {
        todo.text = span.textContent.trim();
        todo.editing = false;
        saveTodos();
        renderTodos();
      }
    };
    span.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        span.blur();
      }
    };

    // Actions menu
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const menuTrigger = document.createElement('button');
    menuTrigger.className = 'menu-trigger';
    menuTrigger.innerHTML = '&#8942;'; // vertical dots
    menuTrigger.title = 'Options';

    const menu = document.createElement('div');
    menu.className = 'actions-menu';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      // Save and cancel editing on all other tasks
      todos.forEach((t, i) => {
        if (t.editing && i !== idx) {
          const prevItem = (t.completed ? completedList : todoList).children[i];
          const prevSpan = prevItem && prevItem.querySelector('.todo-text[contenteditable="true"]');
          if (prevSpan) {
            t.text = prevSpan.textContent.trim();
            t.editing = false;
          }
        }
      });
      // Set this task to editing and mark for auto-select
      todo.editing = true;
      autoSelectIdx = idx;
      autoSelectCompleted = todo.completed;
      saveTodos();
      renderTodos();
      menu.classList.remove('show');
    };
    menu.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      todos.splice(idx, 1);
      saveTodos();
      renderTodos();
      menu.classList.remove('show');
    };  
    menu.appendChild(deleteBtn);

    menuTrigger.onclick = (e) => {
      e.stopPropagation();
      // Cancel editing on all tasks when opening a menu
      todos.forEach(t => t.editing = false);
      saveTodos();
      // Close all other menus except this one
      document.querySelectorAll('.actions-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });
      menu.classList.toggle('show');
    };

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && event.target !== menuTrigger) {
        menu.classList.remove('show');
      }
    });

    actions.appendChild(menuTrigger);
    actions.appendChild(menu);

    const main = document.createElement('div');
    main.className = 'todo-main';
    main.appendChild(checkbox);
    main.appendChild(span);

    li.appendChild(main);
    li.appendChild(actions);

    if (todo.completed) {
      completedList.appendChild(li);
      hasCompleted = true;
    } else {
      todoList.appendChild(li);
    }
  });

  // Show/hide completed section
  document.getElementById('completed-section').style.display = hasCompleted ? 'block' : 'none';

  // Auto-select text for the task just set to edit mode
  if (autoSelectIdx !== null) {
    const list = autoSelectCompleted ? completedList : todoList;
    const currentItem = list.children[autoSelectIdx];
    const editableSpan = currentItem && currentItem.querySelector('.todo-text[contenteditable="true"]');
    if (editableSpan) {
      editableSpan.focus();
      if (window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(editableSpan);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    autoSelectIdx = null;
  }
}

todoForm.onsubmit = (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    todos.unshift({ text, completed: false }); // Add to the beginning
    saveTodos();
    renderTodos();
    todoInput.value = '';
  }
};

document.addEventListener('click', (event) => {
  // If the click is NOT inside an editable span or an actions menu
  if (!event.target.classList.contains('todo-text') &&
      !event.target.classList.contains('menu-trigger') &&
      !event.target.classList.contains('actions-menu') &&
      !event.target.closest('.actions-menu')) {
    let changed = false;
    todos.forEach(t => {
      if (t.editing) {
        t.editing = false;
        changed = true;
      }
    });
    if (changed) {
      saveTodos();
      renderTodos();
    }
  }
});

renderTodos();