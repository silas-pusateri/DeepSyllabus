# OpenSyllabus

OpenSyllabus is an AI-powered application that helps educators generate comprehensive course syllabi with video resources, detailed explanations, and learning assessments.

## Features

- **AI-Generated Syllabi**: Enter a course synopsis and get a complete syllabus with video resources, detailed explanations, and learning assessments.
- **File Upload**: Upload existing course materials to enhance the generated syllabus.
- **Component Regeneration**: Not satisfied with a component? Provide feedback and regenerate it.
- **Component Editing**: Edit any component to customize it to your needs.
- **Component Acceptance**: Accept components to finalize your syllabus.
- **Syllabus Management**: View and manage all your syllabi in one place.

## Technology Stack

- **Frontend**: Svelte with SvelteKit
- **Backend**: SvelteKit API routes
- **Database**: Vercel Postgres
- **File Storage**: Vercel Blob
- **AI**: OpenAI GPT-4 Turbo

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Vercel account (for deployment)
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/opensyllabus.git
   cd opensyllabus
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Deployment

This application is designed to be deployed on Vercel. Follow these steps to deploy:

1. Push your code to a GitHub repository.
2. Connect your repository to Vercel.
3. Set up the environment variables in the Vercel dashboard.
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for providing the AI capabilities
- Vercel for the hosting and database services
- The Svelte team for the amazing framework

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
