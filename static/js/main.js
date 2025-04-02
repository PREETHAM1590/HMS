// Handle form submissions with AJAX
function handleSubmit(formId, endpoint) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable the submit button to prevent multiple submissions
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    }
    
    // Clear any existing alerts
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    // Get form data
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    try {
      // Send the AJAX request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      // Create alert element
      const alertDiv = document.createElement('div');
      alertDiv.classList.add('alert', 'mt-3');
      alertDiv.role = 'alert';
      
      if (result.success) {
        alertDiv.classList.add('alert-success');
        alertDiv.textContent = 'Success! Redirecting...';
        
        // Redirect after successful submission
        setTimeout(() => {
          if (endpoint === '/login' || endpoint === '/signup') {
            window.location.href = '/';
          } else if (endpoint === '/book-appointment') {
            window.location.href = '/bookings';
          }
        }, 1000);
      } else {
        alertDiv.classList.add('alert-danger');
        alertDiv.textContent = result.message || 'Something went wrong. Please try again.';
        
        // Re-enable the submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.textContent.replace('Processing...', 'Submit');
        }
      }
      
      // Add the alert to the form
      form.appendChild(alertDiv);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Create error alert
      const alertDiv = document.createElement('div');
      alertDiv.classList.add('alert', 'alert-danger', 'mt-3');
      alertDiv.role = 'alert';
      alertDiv.textContent = 'Network error. Please try again.';
      form.appendChild(alertDiv);
      
      // Re-enable the submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    }
  });
}

// Validate booking form
function validateBookingForm() {
  const form = document.getElementById('appointmentForm');
  if (!form) return;
  
  const phoneInput = form.querySelector('input[name="number"]');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      // Remove non-numeric characters
      this.value = this.value.replace(/\D/g, '');
      
      // Limit to 10 digits
      if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
      }
    });
  }
  
  const dateInput = form.querySelector('input[name="date"]');
  if (dateInput) {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // Set max date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Add active class to current nav item
  const currentLocation = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentLocation) {
      link.classList.add('active');
    }
  });
  
  // Enable Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}); 