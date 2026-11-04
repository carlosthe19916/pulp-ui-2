Name:           hello-pulp
Version:        %{?pkg_version}%{!?pkg_version:1.0.0}
Release:        1
Summary:        Prints a greeting; published to Pulp by the RPM tutorial
License:        MIT
BuildArch:      noarch

%description
A tiny package built by the Pulp UI RPM tutorial.

%install
mkdir -p %{buildroot}%{_bindir}
printf '#!/bin/sh\necho "Hello, Pulp!"\n' > %{buildroot}%{_bindir}/hello-pulp
chmod 0755 %{buildroot}%{_bindir}/hello-pulp

%files
%{_bindir}/hello-pulp
