function navigate(direction) {
    let nextPage;
    
    if (currentPage === 'dynamic') {
        if (direction === 1) {
            nextPage = 0;
        } else {
            nextPage = 4;
        }
    } else {
        nextPage = currentPage + direction;
        
        // Handle wrapping from result4 to dynamic
        if (nextPage === totalPages) {
            window.location.href = 'result-dynamic.html';
            return;
        }
        // Handle wrapping from result0 to dynamic  
        if (nextPage === -1) {
            window.location.href = 'result-dynamic.html';
            return;
        }
    }
    
    if (nextPage >= 0 && nextPage < totalPages) {
        window.location.href = `result${nextPage}.html`;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        navigate(-1);
    } else if (e.key === 'ArrowRight') {
        navigate(1);
    }
});

// Update button states
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

if (prevBtn && nextBtn) {
    if (currentPage === 'dynamic') {
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    } else {
        prevBtn.disabled = false; // Always allow navigation in the circular system
        nextBtn.disabled = false; // Always allow navigation in the circular system
    }
}
