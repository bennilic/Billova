# Billova

Billova is a personal finance tracking application designed to help users manage and monitor their expenses efficiently. The system leverages Optical Character Recognition (OCR) technology for receipt scanning, along with manual input options, to provide users with actionable insights into their spending habits.

---

## **Features**

### Core Functionalities
- **Receipt Scanning**: Use OCR technology to scan and extract data from receipts.
- **Manual Expense Input**: Add expenses manually when scanning is unavailable or fails.
- **Expense Categorization**: Group expenses by categories such as food, transportation, etc.
- **Search and Sort**: Easily search for and sort expenses by date or category.
- **Monthly Summaries**: View a summary of monthly spending trends.
- **User Management**: Register, log in, and manage user accounts with secure authentication.
- **Multi-Platform Support**: Works across mobile, tablet, and desktop devices.

### Advanced Features (Planned or Implemented)
- **Graphical Insights**: Visualize spending through graphs.
- **Budget Notifications**: Get alerts when approaching set budget limits.
- **Multi-language Support**: Use the app in your preferred language.
- **Collaborative Expense Tracking**: Enable multiple users to collaborate.
- **Bank Sync Integration**: Automatically sync expenses from bank accounts.

---

## **Technology Stack**

### Backend
- **Django**: Python-based web framework for API and business logic.
- **Django REST Framework**: For creating RESTful APIs.
- **Relational Database**: Stores user data, receipts, expenses, and settings.

### Frontend
- **Bootstrap**: Responsive UI framework.
- **JavaScript**: Enhances interactivity.

### Additional Tools
- **OCR API**: For receipt scanning.

---

## **Architecture Overview**

### Modular Components
1. **Backend Module**
   - Role: Processes business logic and integrates with external services like OCR.
   - Handles requests from the frontend and manages data flow between the database and APIs.

2. **Database Module**
   - Stores all user data, receipts, expenses, and settings.
   - Ensures data security and efficient retrieval.

3. **Frontend Module**
   - Provides an intuitive and responsive user interface.
   - Allows users to scan receipts, manage expenses, and view spending summaries.

## Project Setup locally

### Prerequisites 

A Python version of >3.9 installed.

### Clone Project 

git clone [https://github.com/bennilic/Billova/e](https://github.com/bennilic/Billova.git) and switch to main branch.

### Install requirements 

Install the pip requirements for all the packages used by our project.

```bash
pip install -r requirements.txt
```

### run project

```python
python manage.py runserver
```

## **Usage**

1. **Register an Account**
   - Create a new user account and log in.

2. **Add Expenses**
   - Use the receipt scanning feature or manually input expense details.

3. **View and Manage Expenses**
   - Search, sort, and categorize expenses.
   - View monthly summaries to gain financial insights.

4. **Customize Settings**
   - Change currency, categories, and personal preferences.

---

## **Contributing**

We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature description'`
4. Push to your branch: `git push origin feature-name`
5. Open a Pull Request.

---

## **License**

Billova is licensed under the [MIT License](LICENSE).

---

## **Acknowledgments**

- **Developers**:
  - Andreas Drozd (Lead Designer)
  - Benjamin Lichtenstein (Lead Coordinator)
  - Sergiu Iordanescu (Lead Developer)
- **Technologies**: Django, Bootstrap, OCR APIs
