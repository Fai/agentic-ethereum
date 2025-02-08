#!/bin/bash
curl -X POST http://localhost:3400/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"topic": "Zero Knowledge Proofs for Large Language Models"}'