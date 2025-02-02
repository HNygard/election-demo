

# Privacy policy - Hallvard Election

By participating in this election some personal data about you will be handled by the service. They will temporarily be stored in memory of the application and only the results displayed in the presentation will be saved after that.

## Data

- IP address and information about ISP for that IP
- Browser information (user agent, language setting)
- Voting data
- You read the privacy policy

## Who is the data controller?

Hallvard Nygård.

So not really covered by GDPR as this is a private individual.

## Purpose

Demonstrate security aspects in election systems. Use of the application will be part of a talk done by the data collector.


## Your rights

### Right to access infrmation

You have the right to access the information about you that the system is handling. Since the data is not stored to permanent storage, it will likely be deleted before the request is even seen.

Contact Data Protection Officer at election-demo-app@hnygard.no.

### Rectification

If your are are wrong, you have the right to get it fixed. Contact Data Protection Officer for that.

### Deletion

All data will be deleted when the service restarts. If you want to be deleted and I have not restarted the service since you voted, email me at election-demo-app@hnygard.no. I will likely restart the app to delete data from everyone.

### Data portability - take your personal data with you

You have the right to get a copy of your data. This is possible if it's not already deleted (see section about deletion). Contact Data Protection Officer.

Still here? I owe you a beer. Max 3 per election/talk...

## Claim your beer!

<div id="beerForm">
  <input type="text" id="nameInput" placeholder="Enter your name" />
  <button onclick="generateCode()">Generate Code</button>
  <div id="codeResult" style="margin-top: 1rem; display: none;"></div>
</div>

<script>
function generateCode() {
  const name = document.getElementById('nameInput').value;
  if (!name) {
    alert('Please enter your name');
    return;
  }
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const result = document.getElementById('codeResult');
  result.innerHTML = `Your code: <strong>${code}</strong><br>Show this to Hallvard for your beer!`;
  result.style.display = 'block';
}
</script>
