export default function ImpressumPage() {
    return (
        <div className="bg-background">
            {/* Content */}
            <div className="centered-content py-20">
                <h1 className="text-4xl font-bold mb-8 text-primary font-heading">Impressum</h1>

                <div className="prose prose-lg max-w-4xl mx-auto text-foreground">

                    <div>
                        <p>
                            Gebr&uuml;der Chilla GbR
                            <br />
                            Im Mosig 6<br />
                            74249 Jagsthausen
                        </p>

                        <p className="mt-10">
                            <strong>Vertreten durch:</strong>
                            <br />
                            Hannes Chilla und Henri Chilla
                        </p>

                        <h2 className="text-2xl font-bold mb-4 text-secondary font-heading mt-10">Kontakt</h2>
                        <p className="mb-1"></p>
                        <p>E-Mail: hallo@portal-streuobst.de</p>

                    </div>
                </div>
            </div>
        </div>
    );
}
