import TopNav from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HowToPlayPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <TopNav />
      <section className="container mx-auto px-4 py-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
            <CardDescription>
              Connect two actors by alternating between actors and movies they appeared in. Fewer steps and faster time is
              better. In groups, new rounds unlock only after everyone finishes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Start at the given actor.</li>
                <li>Choose a movie they are in.</li>
                <li>Pick a co&#8209;star from that movie.</li>
                <li>Repeat until you reach the target actor.</li>
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                Tip: Use the combobox to search. You can undo or reset any time before submitting.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border bg-muted">
              {/* MUST use the Source URL as provided */}
              <img
                src="https://sjc.microlink.io/yU6OUGMac72Y5n9AW2nciHlceSHjeYszB5RRSraLPNeyEAKmUejDL_l0IwUrh21YI-BqXQU_T5C6YdL7efIxxQ.jpeg"
                alt="Screenshot of www.playreely.com showing a 'How to Play' modal"
                className="w-full h-auto object-cover"
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
