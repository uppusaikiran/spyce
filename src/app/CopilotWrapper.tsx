'use client';

import { CopilotKit } from '@copilotkit/react-core'

export default function CopilotWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CopilotKit 
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY}
    >
      {children}
    </CopilotKit>
  )
} 