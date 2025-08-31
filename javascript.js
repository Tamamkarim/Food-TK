"use strict";
document.addEventListener('DOMContentLoaded', function() {
      const showBtn = document.getElementById('showdialog');
      const dialog = document.getElementById('register-dialog');
      const closeBtn = document.getElementById('close-dialog');
      if (showBtn && dialog && closeBtn) {
        showBtn.addEventListener('click', function() {
          dialog.showModal();
        });
        closeBtn.addEventListener('click', function() {
          dialog.close();
        });
      }
    });