# OpenAI to Gemini Migration - Testing Plan

## ✅ Migration Completed

### Changes Made:
1. **Environment Configuration**: Updated `src/env.js` to include GEMINI_API_KEY in runtime environment
2. **Gemini Utilities**: Created `src/lib/gemini.ts` with streaming and non-streaming text generation functions
3. **Presentation Generation API**: Migrated `src/app/api/presentation/generate/route.ts` from OpenAI to Gemini
4. **Outline Generation API**: Migrated `src/app/api/presentation/outline/route.ts` from OpenAI to Gemini  
5. **AI Command Route**: Implemented `src/app/api/ai/command/route.ts` for text editor AI features using Gemini

### Dependencies:
- ✅ `@google/generative-ai` package already installed
- ✅ Gemini API key configured in environment variables
- ✅ No additional dependencies required

## Testing Checklist

### 🔍 Core Functionality Tests

#### 1. Presentation Outline Generation
- [ ] Navigate to presentation creation page
- [ ] Enter a presentation topic/prompt
- [ ] Select number of slides (e.g., 5-8 slides)
- [ ] Choose language (English/other)
- [ ] Click "Generate Outline"
- [ ] Verify outline is generated with proper formatting
- [ ] Check that exactly the requested number of topics are created
- [ ] Verify each topic has 2-3 bullet points as specified

#### 2. Full Presentation Generation  
- [ ] Use an existing outline or generate a new one
- [ ] Click "Generate Presentation" 
- [ ] Select tone/style options
- [ ] Verify streaming response works (text appears progressively)
- [ ] Check generated XML structure is valid
- [ ] Verify all slides use different layouts (COLUMNS, BULLETS, ICONS, etc.)
- [ ] Confirm images queries are detailed (10+ words)
- [ ] Check that exactly the correct number of slides are generated

#### 3. Text Editor AI Features
- [ ] Navigate to presentation editor
- [ ] Select some text in the editor
- [ ] Use AI commands like "improve", "shorten", "expand"
- [ ] Test AI chat functionality
- [ ] Verify streaming responses work in the text editor
- [ ] Check that AI suggestions are contextual and helpful

### 🧪 API Endpoint Tests

#### Direct API Testing (using curl or Postman):

```bash
# Test Outline Generation
curl -X POST http://localhost:3000/api/presentation/outline \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Introduction to Machine Learning",
    "numberOfCards": 5,
    "language": "English"
  }'

# Test Presentation Generation  
curl -X POST http://localhost:3000/api/presentation/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Machine Learning Basics",
    "outline": ["Introduction to ML", "Types of ML", "Applications", "Tools", "Future"],
    "language": "English",
    "tone": "professional"
  }'

# Test AI Command
curl -X POST http://localhost:3000/api/ai/command \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Can you help me improve this text: The cat sat on the mat."}
    ]
  }'
```

### 🔧 Error Handling Tests
- [ ] Test with invalid/missing API key
- [ ] Test with malformed requests (missing required fields)
- [ ] Test with very long prompts
- [ ] Test with non-English languages
- [ ] Test rate limiting scenarios
- [ ] Verify proper error messages are returned

### 🎯 Performance Tests
- [ ] Test generation speed compared to previous OpenAI implementation
- [ ] Check memory usage during streaming
- [ ] Test with multiple concurrent requests
- [ ] Verify streaming doesn't timeout

### 🌐 Integration Tests  
- [ ] Test full user workflow: Sign in → Create outline → Generate presentation → Edit with AI
- [ ] Test presentation export/save functionality
- [ ] Verify image generation still works (Together AI integration unchanged)
- [ ] Test with different user accounts/sessions

## Success Criteria

### ✅ Functional Requirements
- All AI-powered features work as expected
- Response quality is comparable to or better than OpenAI
- Streaming functionality works smoothly  
- No functionality regression

### ✅ Technical Requirements
- No compilation errors
- Proper error handling and logging
- API responses follow expected format
- Authentication and authorization work correctly

### ✅ User Experience
- Response times are acceptable (< 30 seconds for presentations)
- UI remains responsive during generation
- Error messages are user-friendly
- Streaming provides good visual feedback

## Rollback Plan

If critical issues are discovered:
1. Revert the 4 migrated API route files to use OpenAI
2. Restore original environment configuration
3. Add OpenAI API key back to environment variables
4. Remove Gemini utility file if desired

## Notes
- Image generation remains on Together AI (unchanged)
- Gemini API has different rate limits than OpenAI - monitor usage
- Consider implementing fallback to OpenAI for critical failures (future enhancement)
- Monitor Gemini API costs vs OpenAI costs for budget planning
