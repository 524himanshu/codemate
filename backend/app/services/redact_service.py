import re

class PIIRedactor:
    def __init__(self):
        # Email pattern
        self.email_pattern = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
        # Common phone number formats (with or without country codes, spaces, or dashes)
        self.phone_pattern = re.compile(r'\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}')
        # Common address patterns (simple street/city name detections)
        self.address_keywords = [
            r'\d+\s+[a-zA-Z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)',
            r'(?:Mumbai|Delhi|Bangalore|Kolkata|Chennai|Hyderabad|Pune|Ahmedabad|India)\b'
        ]
        self.address_patterns = [re.compile(p, re.IGNORECASE) for p in self.address_keywords]

    def redact(self, text: str) -> str:
        if not text:
            return ""

        # Redact emails
        redacted = self.email_pattern.sub("[EMAIL_REDACTED]", text)
        
        # Redact phones (excluding short year lengths like 2026 or small numbers)
        # We replace matches that are longer than 6 digits to avoid redacting random integers
        def phone_replacer(match):
            val = match.group(0)
            digits_count = sum(c.isdigit() for c in val)
            if digits_count >= 7:
                return "[PHONE_REDACTED]"
            return val
            
        redacted = self.phone_pattern.sub(phone_replacer, redacted)

        # Redact location addresses
        for pattern in self.address_patterns:
            redacted = pattern.sub("[LOCATION_REDACTED]", redacted)

        return redacted

pii_redactor = PIIRedactor()
