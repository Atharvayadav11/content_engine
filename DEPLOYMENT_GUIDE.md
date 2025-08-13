# Render Deployment Guide for Content Engine

This guide will help you deploy your blog engine to Render.

## Prerequisites

1. **GitHub Repository**: Your code is already pushed to `https://github.com/Atharvayadav11/content_engine.git` ✅
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Database**: You'll need a MongoDB connection string (MongoDB Atlas recommended)

## Environment Variables You'll Need

Before deploying, gather these API keys and credentials:

### Backend Environment Variables:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT tokens
- `CLERK_SECRET_KEY` - Your Clerk authentication secret
- `ANTHROPIC_API_KEY` - For Claude AI integration
- `GEMINI_API_KEY` - For Google Gemini AI integration
- `PORT` - Will be set automatically by Render
- `NODE_ENV` - Will be set to "production"

### Frontend Environment Variables:
- `VITE_API_URL` - Your backend URL (will be: `https://content-engine-backend.onrender.com/api`)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Connect Repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repo: `Atharvayadav11/content_engine`
   - Render will automatically detect the `render.yaml` file

2. **Set Environment Variables:**
   - After creating the services, go to each service settings
   - Add all the environment variables listed above

### Option 2: Manual Deployment

#### Deploy Backend:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `content-engine-backend`
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add environment variables in "Environment" tab

#### Deploy Frontend:
1. Click "New" → "Static Site"
2. Connect your GitHub repo
3. Configure:
   - **Name**: `content-engine-frontend`
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   - `VITE_API_URL`: `https://content-engine-backend.onrender.com/api`

## Post-Deployment Steps

1. **Update CORS**: Your backend is already configured to accept requests from `https://content-engine-frontend.onrender.com`

2. **Test the Application**:
   - Frontend: `https://content-engine-frontend.onrender.com`
   - Backend API: `https://content-engine-backend.onrender.com`

3. **Monitor Logs**: Check Render dashboard for any deployment issues

## Important Notes

- **Free Plan Limitations**: Services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep may take 30+ seconds
- **Database**: Use MongoDB Atlas (free tier available)
- **Domain**: You can add custom domains in Render settings

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure frontend URL is added to backend CORS configuration
2. **Environment Variables**: Double-check all required env vars are set
3. **Build Failures**: Check build logs in Render dashboard
4. **Database Connection**: Verify MongoDB URI is correct and accessible

### Getting Help:
- Check Render documentation: [docs.render.com](https://docs.render.com)
- Review deployment logs in Render dashboard
- Ensure all API keys are valid and have proper permissions

## Next Steps After Deployment

1. Set up monitoring and logging
2. Configure custom domain (optional)
3. Set up automated deployments from main branch
4. Consider upgrading to paid plan for better performance

Your Content Engine will be live at:
- **Frontend**: `https://content-engine-frontend.onrender.com`
- **Backend API**: `https://content-engine-backend.onrender.com`
